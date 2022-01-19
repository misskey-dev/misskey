import config from '@/config/index';
import Resolver from '../resolver';
import { analyzeAttachments, resolvePerson, updateFeatured } from './person';
import { IRemoteUser, User } from '@/models/entities/user';
import { apLogger } from '../logger';
import { extractDbHost } from '@/misc/convert-host';
import { Clips, DriveFiles, Followings, UserProfiles, UserPublickeys, Users } from '@/models/index';
import { getApId, getApType, getOneApHrefNullable, getOneApId, IObject, IOrderedCollection } from '../type';
import { genId } from '@/misc/gen-id';
import { fetchMeta } from '@/misc/fetch-meta';
import { getApLock } from '@/misc/app-lock';
import DbResolver from '../db-resolver';
import { StatusError } from '@/misc/fetch';
import { Clip } from '@/models/entities/clip';

const logger = apLogger;

export function validateClip(object: any, uri: string) {
	const expectHost = extractDbHost(uri);

	if (object == null) {
		return new Error('invalid Clip: object is null');
	}

	if (getApType(object) !== 'OrderedCollection') {
		return new Error(`invalid Clip: invalid object type ${getApType(object)}`);
	}

	if (!object.summary?.includes('misskey:clip')) {
		return new Error(`invalid Clip: does not contain magic string misskey:clip`);
	}

	if (object.id && extractDbHost(object.id) !== expectHost) {
		return new Error(`invalid Clip: id has different host. expected: ${expectHost}, actual: ${extractDbHost(object.id)}`);
	}

	if (object.attributedTo && extractDbHost(getOneApId(object.attributedTo)) !== expectHost) {
		return new Error(`invalid Clip: attributedTo has different host. expected: ${expectHost}, actual: ${extractDbHost(object.attributedTo)}`);
	}

	return null;
}

/**
 * Clipをフェッチします。
 *
 * Misskeyに対象のClipが登録されていればそれを返します。
 */
export async function fetchClip(object: string | IObject): Promise<Clip | null> {
	const dbResolver = new DbResolver();
	return await dbResolver.getClipFromApId(object);
}

/**
 * Clipを作成します。
 */
export async function createClip(value: string | IObject, resolver?: Resolver, silent = false): Promise<Clip | null> {
	if (resolver == null) resolver = new Resolver();

	const object: any = await resolver.resolveCollection(value);

	const entryUri = getApId(value);
	const err = validateClip(object, entryUri);
	if (err) {
		logger.error(`${err.message}`, {
			resolver: {
				history: resolver.getHistory(),
			},
			value: value,
			object: object,
		});
		throw new Error('invalid clip');
	}

	const clip: IOrderedCollection = object;

	logger.debug(`Clip fetched: ${JSON.stringify(clip, null, 2)}`);

	logger.info(`Creating the Clip: ${clip.id}`);

	// 投稿者をフェッチ
	const actor = await resolvePerson(getOneApId(clip.attributedTo), resolver) as IRemoteUser;

	// 投稿者が凍結されていたらスキップ
	if (actor.isSuspended) {
		throw new Error('actor has been suspended');
	}

	// TODO: Assume clip is public?

	return await Clips.insert({
		id: genId(),
		createdAt: new Date(),
		userId: actor.id,
		name: clip.name,
		isPublic: true,
		description: clip.content,
		uri: clip.id,getcolle
	}).then(x => Clips.findOneOrFail(x.identifiers[0]));

}

/**
 * Clipを解決します。
 *
 * Misskeyに対象のClipが登録されていればそれを返し、そうでなければ
 * リモートサーバーからフェッチしてMisskeyに登録しそれを返します。
 */
export async function resolveClip(value: string | IObject, resolver?: Resolver): Promise<Clip | null> {
	const uri = typeof value === 'string' ? value : value.id;
	if (uri == null) throw new Error('missing uri');

	// ブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(extractDbHost(uri))) throw { statusCode: 451 };

	const unlock = await getApLock(uri);

	try {
		//#region このサーバーに既に登録されていたらそれを返す
		const exist = await fetchClip(uri);

		if (exist) {
			return exist;
		}
		//#endregion

		if (uri.startsWith(config.url)) {
			throw new StatusError('cannot resolve local clip', 400, 'cannot resolve local clip');
		}

		// リモートサーバーからフェッチしてきて登録
		// ここでuriの代わりに添付されてきたClip Objectが指定されていると、サーバーフェッチを経ずにClipが生成されるが
		// 添付されてきたClip Objectは偽装されている可能性があるため、常にuriを指定してサーバーフェッチを行う。
		return await createClip(uri, resolver, true);
	} finally {
		unlock();
	}
}

export async function updateClip(uri: string, resolver: Resolver | null, hint: IOrderedCollection, actor: IRemoteUser): Promise<void> {
	// URIがこのサーバーを指しているならスキップ
	if (uri.startsWith(config.url + '/')) {
		return;
	}

	if (resolver == null) resolver = new Resolver();

	const object = hint || await resolver.resolve(uri) as any;

	const clip = await Clips.findOne({
		where: {
			uri
		}
	});

	if (clip == null) {
		throw new Error('Clip does not exist');
	}

	if (clip.userId != actor.id) {
		throw new Error('Actor does not own clip');
	}

	logger.info(`Updating the Clip: ${clip.id}`);

	const updates = {
		name: object.name,
		description: object.content,
	} as Partial<Clip>;

	// Update clip
	await Clips.update(clip.id, updates);
}
