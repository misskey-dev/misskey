import * as promiseLimit from 'promise-limit';

import config from '../../../config';
import Resolver from '../resolver';
import { resolveImage } from './image';
import { isCollectionOrOrderedCollection, isCollection, IPerson } from '../type';
import { DriveFile } from '../../../models/entities/drive-file';
import { fromHtml } from '../../../mfm/fromHtml';
import { URL } from 'url';
import { resolveNote, extractEmojis } from './note';
import { registerOrFetchInstanceDoc } from '../../../services/register-or-fetch-instance-doc';
import { ITag, extractHashtags } from './tag';
import { IIdentifier } from './identifier';
import { apLogger } from '../logger';
import { Note } from '../../../models/entities/note';
import { updateHashtag } from '../../../services/update-hashtag';
import { Users, UserNotePinings, Instances, DriveFiles, Followings, UserProfiles, UserPublickeys } from '../../../models';
import { User, IRemoteUser } from '../../../models/entities/user';
import { Emoji } from '../../../models/entities/emoji';
import { UserNotePining } from '../../../models/entities/user-note-pinings';
import { genId } from '../../../misc/gen-id';
import { instanceChart, usersChart } from '../../../services/chart';
import { UserPublickey } from '../../../models/entities/user-publickey';
import { isDuplicateKeyValueError } from '../../../misc/is-duplicate-key-value-error';
import { toPuny } from '../../../misc/convert-host';
import { UserProfile } from '../../../models/entities/user-profile';
const logger = apLogger;

/**
 * Validate Person object
 * @param x Fetched person object
 * @param uri Fetch target URI
 */
function validatePerson(x: any, uri: string) {
	const expectHost = toPuny(new URL(uri).hostname);

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

	if (!Users.validateUsername(x.preferredUsername, true)) {
		return new Error('invalid person: invalid username');
	}

	if (!Users.isValidName(x.name == '' ? null : x.name)) {
		return new Error('invalid person: invalid name');
	}

	if (typeof x.id !== 'string') {
		return new Error('invalid person: id is not a string');
	}

	const idHost = toPuny(new URL(x.id).hostname);
	if (idHost !== expectHost) {
		return new Error('invalid person: id has different host');
	}

	if (typeof x.publicKey.id !== 'string') {
		return new Error('invalid person: publicKey.id is not a string');
	}

	const publicKeyIdHost = toPuny(new URL(x.publicKey.id).hostname);
	if (publicKeyIdHost !== expectHost) {
		return new Error('invalid person: publicKey.id has different host');
	}

	return null;
}

/**
 * Personをフェッチします。
 *
 * Misskeyに対象のPersonが登録されていればそれを返します。
 */
export async function fetchPerson(uri: string, resolver?: Resolver): Promise<User> {
	if (typeof uri !== 'string') throw 'uri is not string';

	// URIがこのサーバーを指しているならデータベースからフェッチ
	if (uri.startsWith(config.url + '/')) {
		const id = uri.split('/').pop();
		return await Users.findOne(id);
	}

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await Users.findOne({ uri });

	if (exist) {
		return exist;
	}
	//#endregion

	return null;
}

/**
 * Personを作成します。
 */
export async function createPerson(uri: string, resolver?: Resolver): Promise<User> {
	if (typeof uri !== 'string') throw 'uri is not string';

	if (resolver == null) resolver = new Resolver();

	const object = await resolver.resolve(uri) as any;

	const err = validatePerson(object, uri);

	if (err) {
		throw err;
	}

	const person: IPerson = object;

	logger.info(`Creating the Person: ${person.id}`);

	const host = toPuny(new URL(object.id).hostname);

	const { fields } = analyzeAttachments(person.attachment);

	const tags = extractHashtags(person.tag).map(tag => tag.toLowerCase());

	const isBot = object.type == 'Service';

	// Create user
	let user: IRemoteUser;
	try {
		user = await Users.save({
			id: genId(),
			avatarId: null,
			bannerId: null,
			createdAt: Date.parse(person.published) || new Date(),
			lastFetchedAt: new Date(),
			name: person.name,
			isLocked: person.manuallyApprovesFollowers,
			username: person.preferredUsername,
			usernameLower: person.preferredUsername.toLowerCase(),
			host,
			inbox: person.inbox,
			sharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined),
			featured: person.featured,
			endpoints: person.endpoints,
			uri: person.id,
			url: person.url,
			tags,
			isBot,
			isCat: (person as any).isCat === true
		} as Partial<User>) as IRemoteUser;
	} catch (e) {
		// duplicate key error
		if (isDuplicateKeyValueError(e)) {
			throw new Error('already registered');
		}

		logger.error(e);
		throw e;
	}

	await UserProfiles.save({
		userId: user.id,
		description: fromHtml(person.summary),
		fields,
	} as Partial<UserProfile>);

	await UserPublickeys.save({
		userId: user.id,
		keyId: person.publicKey.id,
		keyPem: person.publicKey.publicKeyPem
	} as UserPublickey);

	// Register host
	registerOrFetchInstanceDoc(host).then(i => {
		Instances.increment({ id: i.id }, 'usersCount', 1);
		instanceChart.newUser(i.host);
	});

	usersChart.update(user, true);

	// ハッシュタグ更新
	for (const tag of tags) updateHashtag(user, tag, true, true);
	for (const tag of (user.tags || []).filter(x => !tags.includes(x))) updateHashtag(user, tag, true, false);

	//#region アイコンとヘッダー画像をフェッチ
	const [avatar, banner] = (await Promise.all<DriveFile>([
		person.icon,
		person.image
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(user, img).catch(() => null)
	)));

	const avatarId = avatar ? avatar.id : null;
	const bannerId = banner ? banner.id : null;
	const avatarUrl = avatar ? DriveFiles.getPublicUrl(avatar) : null;
	const bannerUrl = banner ? DriveFiles.getPublicUrl(banner) : null;
	const avatarColor = avatar && avatar.properties.avgColor ? avatar.properties.avgColor : null;
	const bannerColor = banner && avatar.properties.avgColor ? banner.properties.avgColor : null;

	await Users.update(user.id, {
		avatarId,
		bannerId,
		avatarUrl,
		bannerUrl,
		avatarColor,
		bannerColor
	});

	user.avatarId = avatarId;
	user.bannerId = bannerId;
	user.avatarUrl = avatarUrl;
	user.bannerUrl = bannerUrl;
	user.avatarColor = avatarColor;
	user.bannerColor = bannerColor;
	//#endregion

	//#region カスタム絵文字取得
	const emojis = await extractEmojis(person.tag, host).catch(e => {
		logger.info(`extractEmojis: ${e}`);
		return [] as Emoji[];
	});

	const emojiNames = emojis.map(emoji => emoji.name);

	await Users.update(user.id, {
		emojis: emojiNames
	});
	//#endregion

	await updateFeatured(user.id).catch(err => logger.error(err));

	return user;
}

/**
 * Personの情報を更新します。
 * Misskeyに対象のPersonが登録されていなければ無視します。
 * @param uri URI of Person
 * @param resolver Resolver
 * @param hint Hint of Person object (この値が正当なPersonの場合、Remote resolveをせずに更新に利用します)
 */
export async function updatePerson(uri: string, resolver?: Resolver, hint?: object): Promise<void> {
	if (typeof uri !== 'string') throw 'uri is not string';

	// URIがこのサーバーを指しているならスキップ
	if (uri.startsWith(config.url + '/')) {
		return;
	}

	//#region このサーバーに既に登録されているか
	const exist = await Users.findOne({ uri }) as IRemoteUser;

	if (exist == null) {
		return;
	}
	//#endregion

	// 繋がらないインスタンスに何回も試行するのを防ぐ, 後続の同様処理の連続試行を防ぐ ため 試行前にも更新する
	await Users.update(exist.id, {
		lastFetchedAt: new Date(),
	});

	if (resolver == null) resolver = new Resolver();

	const object = hint || await resolver.resolve(uri) as any;

	const err = validatePerson(object, uri);

	if (err) {
		throw err;
	}

	const person: IPerson = object;

	logger.info(`Updating the Person: ${person.id}`);

	// アイコンとヘッダー画像をフェッチ
	const [avatar, banner] = (await Promise.all<DriveFile>([
		person.icon,
		person.image
	].map(img =>
		img == null
			? Promise.resolve(null)
			: resolveImage(exist, img).catch(() => null)
	)));

	// カスタム絵文字取得
	const emojis = await extractEmojis(person.tag, exist.host).catch(e => {
		logger.info(`extractEmojis: ${e}`);
		return [] as Emoji[];
	});

	const emojiNames = emojis.map(emoji => emoji.name);

	const { fields, services } = analyzeAttachments(person.attachment);

	const tags = extractHashtags(person.tag).map(tag => tag.toLowerCase());

	const updates = {
		lastFetchedAt: new Date(),
		inbox: person.inbox,
		sharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined),
		featured: person.featured,
		emojis: emojiNames,
		description: fromHtml(person.summary),
		name: person.name,
		url: person.url,
		endpoints: person.endpoints,
		fields,
		tags,
		isBot: object.type == 'Service',
		isCat: (person as any).isCat === true,
		isLocked: person.manuallyApprovesFollowers,
		createdAt: new Date(Date.parse(person.published)) || null,
	} as Partial<User>;

	if (avatar) {
		updates.avatarId = avatar.id;
		updates.avatarUrl = DriveFiles.getPublicUrl(avatar);
		updates.avatarColor = avatar.properties.avgColor ? avatar.properties.avgColor : null;
	}

	if (banner) {
		updates.bannerId = banner.id;
		updates.bannerUrl = DriveFiles.getPublicUrl(banner);
		updates.bannerColor = banner.properties.avgColor ? banner.properties.avgColor : null;
	}

	// Update user
	await Users.update(exist.id, updates);

	await UserPublickeys.update({ userId: exist.id }, {
		keyId: person.publicKey.id,
		keyPem: person.publicKey.publicKeyPem
	});

	await UserProfiles.update({ userId: exist.id }, {
		twitterUserId: services.twitter.userId,
		twitterScreenName: services.twitter.screenName,
		githubId: services.github.id,
		githubLogin: services.github.login,
		discordId: services.discord.id,
		discordUsername: services.discord.username,
		discordDiscriminator: services.discord.discriminator,
	});

	// ハッシュタグ更新
	for (const tag of tags) updateHashtag(exist, tag, true, true);
	for (const tag of (exist.tags || []).filter(x => !tags.includes(x))) updateHashtag(exist, tag, true, false);

	// 該当ユーザーが既にフォロワーになっていた場合はFollowingもアップデートする
	await Followings.update({
		followerId: exist.id
	}, {
		followerSharedInbox: person.sharedInbox || (person.endpoints ? person.endpoints.sharedInbox : undefined)
	});

	await updateFeatured(exist.id).catch(err => logger.error(err));
}

/**
 * Personを解決します。
 *
 * Misskeyに対象のPersonが登録されていればそれを返し、そうでなければ
 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
 */
export async function resolvePerson(uri: string, verifier?: string, resolver?: Resolver): Promise<User> {
	if (typeof uri !== 'string') throw 'uri is not string';

	//#region このサーバーに既に登録されていたらそれを返す
	const exist = await fetchPerson(uri);

	if (exist) {
		return exist;
	}
	//#endregion

	// リモートサーバーからフェッチしてきて登録
	if (resolver == null) resolver = new Resolver();
	return await createPerson(uri, resolver);
}

const isPropertyValue = (x: {
		type: string,
		name?: string,
		value?: string
	}) =>
		x &&
		x.type === 'PropertyValue' &&
		typeof x.name === 'string' &&
		typeof x.value === 'string';

const services: {
		[x: string]: (id: string, username: string) => any
	} = {
	'misskey:authentication:twitter': (userId, screenName) => ({ userId, screenName }),
	'misskey:authentication:github': (id, login) => ({ id, login }),
	'misskey:authentication:discord': (id, name) => $discord(id, name)
};

const $discord = (id: string, name: string) => {
	if (typeof name !== 'string')
		name = 'unknown#0000';
	const [username, discriminator] = name.split('#');
	return { id, username, discriminator };
};

function addService(target: { [x: string]: any }, source: IIdentifier) {
	const service = services[source.name];

	if (typeof source.value !== 'string')
		source.value = 'unknown';

	const [id, username] = source.value.split('@');

	if (service)
		target[source.name.split(':')[2]] = service(id, username);
}

export function analyzeAttachments(attachments: ITag[]) {
	const fields: {
		name: string,
		value: string
	}[] = [];
	const services: { [x: string]: any } = {};

	if (Array.isArray(attachments))
		for (const attachment of attachments.filter(isPropertyValue))
			if (isPropertyValue(attachment.identifier))
				addService(services, attachment.identifier);
			else
				fields.push({
					name: attachment.name,
					value: fromHtml(attachment.value)
				});

	return { fields, services };
}

export async function updateFeatured(userId: User['id']) {
	const user = await Users.findOne(userId);
	if (!Users.isRemoteUser(user)) return;
	if (!user.featured) return;

	logger.info(`Updating the featured: ${user.uri}`);

	const resolver = new Resolver();

	// Resolve to (Ordered)Collection Object
	const collection = await resolver.resolveCollection(user.featured);
	if (!isCollectionOrOrderedCollection(collection)) throw new Error(`Object is not Collection or OrderedCollection`);

	// Resolve to Object(may be Note) arrays
	const unresolvedItems = isCollection(collection) ? collection.items : collection.orderedItems;
	const items = await resolver.resolve(unresolvedItems);
	if (!Array.isArray(items)) throw new Error(`Collection items is not an array`);

	// Resolve and regist Notes
	const limit = promiseLimit(2);
	const featuredNotes = await Promise.all(items
		.filter(item => item.type === 'Note')
		.slice(0, 5)
		.map(item => limit(() => resolveNote(item, resolver)) as Promise<Note>));

	for (const note of featuredNotes.filter(note => note != null)) {
		UserNotePinings.save({
			id: genId(),
			createdAt: new Date(),
			userId: user.id,
			noteId: note.id
		} as UserNotePining);
	}
}
