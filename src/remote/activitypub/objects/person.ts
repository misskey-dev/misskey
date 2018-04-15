import { JSDOM } from 'jsdom';
import { toUnicode } from 'punycode';
import * as debug from 'debug';

import config from '../../../config';
import User, { validateUsername, isValidName, IUser, IRemoteUser } from '../../../models/user';
import webFinger from '../../webfinger';
import Resolver from '../resolver';
import { resolveImage } from './image';
import { isCollectionOrOrderedCollection, IObject, IPerson } from '../type';

const log = debug('misskey:activitypub');

/**
 * Personをフェッチします。
 *
 * Misskeyに対象のPersonが登録されていればそれを返します。
 */
export async function fetchPerson(value: string | IObject, resolver?: Resolver): Promise<IUser> {
	const uri = typeof value == 'string' ? value : value.id;

	// URIがこのサーバーを指しているならデータベースからフェッチ
	if (uri.startsWith(config.url + '/')) {
		return await User.findOne({ _id: uri.split('/').pop() });
	}

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await User.findOne({ uri });

	if (exist) {
		return exist;
	}
	//#endregion

	return null;
}

/**
 * Personを作成します。
 */
export async function createPerson(value: any, resolver?: Resolver): Promise<IUser> {
	if (resolver == null) resolver = new Resolver();

	const object = await resolver.resolve(value) as any;

	if (
		object == null ||
		object.type !== 'Person' ||
		typeof object.preferredUsername !== 'string' ||
		!validateUsername(object.preferredUsername) ||
		!isValidName(object.name == '' ? null : object.name)
	) {
		log(`invalid person: ${JSON.stringify(object, null, 2)}`);
		throw new Error('invalid person');
	}

	const person: IPerson = object;

	log(`Creating the Person: ${person.id}`);

	const [followersCount = 0, followingCount = 0, notesCount = 0, finger] = await Promise.all([
		resolver.resolve(person.followers).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		resolver.resolve(person.following).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		resolver.resolve(person.outbox).then(
			resolved => isCollectionOrOrderedCollection(resolved) ? resolved.totalItems : undefined,
			() => undefined
		),
		webFinger(person.id)
	]);

	const host = toUnicode(finger.subject.replace(/^.*?@/, '')).toLowerCase();
	const summaryDOM = JSDOM.fragment(person.summary);

	// Create user
	const user = await User.insert({
		avatarId: null,
		bannerId: null,
		createdAt: Date.parse(person.published) || null,
		description: summaryDOM.textContent,
		followersCount,
		followingCount,
		notesCount,
		name: person.name,
		driveCapacity: 1024 * 1024 * 8, // 8MiB
		username: person.preferredUsername,
		usernameLower: person.preferredUsername.toLowerCase(),
		host,
		publicKey: {
			id: person.publicKey.id,
			publicKeyPem: person.publicKey.publicKeyPem
		},
		inbox: person.inbox,
		uri: person.id,
		url: person.url
	}) as IRemoteUser;

	//#region アイコンとヘッダー画像をフェッチ
	const [avatarId, bannerId] = (await Promise.all([
		person.icon,
		person.image
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(user, img)
	))).map(file => file != null ? file._id : null);

	User.update({ _id: user._id }, { $set: { avatarId, bannerId } });

	user.avatarId = avatarId;
	user.bannerId = bannerId;
	//#endregion

	return user;
}

/**
 * Personを解決します。
 *
 * Misskeyに対象のPersonが登録されていればそれを返し、そうでなければ
 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
 */
export async function resolvePerson(value: string | IObject, verifier?: string): Promise<IUser> {
	const uri = typeof value == 'string' ? value : value.id;

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await fetchPerson(uri);

	if (exist) {
		return exist;
	}
	//#endregion

	// リモートサーバーからフェッチしてきて登録
	return await createPerson(value);
}
