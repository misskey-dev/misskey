import * as mongo from 'mongodb';
import { toUnicode } from 'punycode';
import * as debug from 'debug';

import config from '../../../config';
import User, { validateUsername, isValidName, IUser, IRemoteUser } from '../../../models/user';
import webFinger from '../../webfinger';
import Resolver from '../resolver';
import { resolveImage } from './image';
import { isCollectionOrOrderedCollection, IObject, IPerson } from '../type';
import { IDriveFile } from '../../../models/drive-file';
import Meta from '../../../models/meta';
import htmlToMFM from '../../../mfm/html-to-mfm';
import { updateUserStats } from '../../../services/update-chart';

const log = debug('misskey:activitypub');

function validatePerson(x: any) {
	if (x == null) {
		return new Error('invalid person: object is null');
	}

	if (x.type != 'Person' && x.type != 'Service') {
		return new Error(`invalid person: object is not a person or service '${x.type}'`);
	}

	if (typeof x.preferredUsername !== 'string') {
		return new Error('invalid person: preferredUsername is not a string');
	}

	if (typeof x.inbox !== 'string') {
		return new Error('invalid person: inbox is not a string');
	}

	if (!validateUsername(x.preferredUsername)) {
		return new Error('invalid person: invalid username');
	}

	if (!isValidName(x.name == '' ? null : x.name)) {
		return new Error('invalid person: invalid name');
	}

	return null;
}

/**
 * Personをフェッチします。
 *
 * Misskeyに対象のPersonが登録されていればそれを返します。
 */
export async function fetchPerson(value: string | IObject, resolver?: Resolver): Promise<IUser> {
	const uri = typeof value == 'string' ? value : value.id;

	// URIがこのサーバーを指しているならデータベースからフェッチ
	if (uri.startsWith(config.url + '/')) {
		const id = new mongo.ObjectID(uri.split('/').pop());
		return await User.findOne({ _id: id });
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

	const err = validatePerson(object);

	if (err) {
		throw err;
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

	const isBot = object.type == 'Service';

	// Create user
	let user: IRemoteUser;
	try {
		user = await User.insert({
			avatarId: null,
			bannerId: null,
			createdAt: Date.parse(person.published) || null,
			description: htmlToMFM(person.summary),
			followersCount,
			followingCount,
			notesCount,
			name: person.name,
			isLocked: person.manuallyApprovesFollowers,
			username: person.preferredUsername,
			usernameLower: person.preferredUsername.toLowerCase(),
			host,
			publicKey: {
				id: person.publicKey.id,
				publicKeyPem: person.publicKey.publicKeyPem
			},
			inbox: person.inbox,
			sharedInbox: person.sharedInbox,
			endpoints: person.endpoints,
			uri: person.id,
			url: person.url,
			isBot: isBot,
			isCat: (person as any).isCat === true ? true : false
		}) as IRemoteUser;
	} catch (e) {
		// duplicate key error
		if (e.code === 11000) {
			throw new Error('already registered');
		}

		console.error(e);
		throw e;
	}

	//#region Increment users count
	Meta.update({}, {
		$inc: {
			'stats.usersCount': 1
		}
	}, { upsert: true });

	updateUserStats(user, true);
	//#endregion

	//#region アイコンとヘッダー画像をフェッチ
	const [avatar, banner] = (await Promise.all<IDriveFile>([
		person.icon,
		person.image
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(user, img)
	)));

	const avatarId = avatar ? avatar._id : null;
	const bannerId = banner ? banner._id : null;
	const avatarUrl = (avatar && avatar.metadata.thumbnailUrl) ? avatar.metadata.thumbnailUrl : (avatar && avatar.metadata.url) ? avatar.metadata.url : null;
	const bannerUrl = (banner && banner.metadata.url) ? banner.metadata.url : null;

	await User.update({ _id: user._id }, {
		$set: {
			avatarId,
			bannerId,
			avatarUrl,
			bannerUrl
		}
	});

	user.avatarId = avatarId;
	user.bannerId = bannerId;
	user.avatarUrl = avatarUrl;
	user.bannerUrl = bannerUrl;
	//#endregion

	return user;
}

/**
 * Personの情報を更新します。
 *
 * Misskeyに対象のPersonが登録されていなければ無視します。
 */
export async function updatePerson(value: string | IObject, resolver?: Resolver): Promise<void> {
	const uri = typeof value == 'string' ? value : value.id;

	// URIがこのサーバーを指しているならスキップ
	if (uri.startsWith(config.url + '/')) {
		return;
	}

	//#region このサーバーに既に登録されているか
	const exist = await User.findOne({ uri }) as IRemoteUser;

	if (exist == null) {
		return;
	}
	//#endregion

	if (resolver == null) resolver = new Resolver();

	const object = await resolver.resolve(value) as any;

	const err = validatePerson(object);

	if (err) {
		throw err;
	}

	const person: IPerson = object;

	log(`Updating the Person: ${person.id}`);

	const [followersCount = 0, followingCount = 0, notesCount = 0] = await Promise.all([
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
		)
	]);

	// アイコンとヘッダー画像をフェッチ
	const [avatar, banner] = (await Promise.all<IDriveFile>([
		person.icon,
		person.image
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(exist, img)
	)));

	// Update user
	await User.update({ _id: exist._id }, {
		$set: {
			updatedAt: new Date(),
			inbox: person.inbox,
			sharedInbox: person.sharedInbox,
			avatarId: avatar ? avatar._id : null,
			bannerId: banner ? banner._id : null,
			avatarUrl: (avatar && avatar.metadata.thumbnailUrl) ? avatar.metadata.thumbnailUrl : (avatar && avatar.metadata.url) ? avatar.metadata.url : null,
			bannerUrl: banner && banner.metadata.url ? banner.metadata.url : null,
			description: htmlToMFM(person.summary),
			followersCount,
			followingCount,
			notesCount,
			name: person.name,
			url: person.url,
			endpoints: person.endpoints,
			isCat: (person as any).isCat === true ? true : false
		}
	});
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
