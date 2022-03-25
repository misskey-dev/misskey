import escapeRegexp from 'escape-regexp';
import config from '@/config/index.js';
import { Note } from '@/models/entities/note.js';
import { User, IRemoteUser, CacheableRemoteUser } from '@/models/entities/user.js';
import { UserPublickey } from '@/models/entities/user-publickey.js';
import { MessagingMessage } from '@/models/entities/messaging-message.js';
import { Notes, Users, UserPublickeys, MessagingMessages } from '@/models/index.js';
import { IObject, getApId } from './type.js';
import { resolvePerson } from './models/person.js';
import { Cache } from '@/misc/cache.js';
import { userByIdCache } from '@/services/user-cache.js';

const publicKeyCache = new Cache<UserPublickey | null>(Infinity);
const publicKeyByUserIdCache = new Cache<UserPublickey | null>(Infinity);

export default class DbResolver {
	constructor() {
	}

	/**
	 * AP Note => Misskey Note in DB
	 */
	public async getNoteFromApId(value: string | IObject): Promise<Note | null> {
		const parsed = this.parseUri(value);

		if (parsed.id) {
			return (await Notes.findOne({
				id: parsed.id,
			})) || null;
		}

		if (parsed.uri) {
			return (await Notes.findOne({
				uri: parsed.uri,
			})) || null;
		}

		return null;
	}

	public async getMessageFromApId(value: string | IObject): Promise<MessagingMessage | null> {
		const parsed = this.parseUri(value);

		if (parsed.id) {
			return (await MessagingMessages.findOne({
				id: parsed.id,
			})) || null;
		}

		if (parsed.uri) {
			return (await MessagingMessages.findOne({
				uri: parsed.uri,
			})) || null;
		}

		return null;
	}

	/**
	 * AP Person => Misskey User in DB
	 */
	public async getUserFromApId(value: string | IObject): Promise<User | null> {
		const parsed = this.parseUri(value);

		if (parsed.id) {
			return (await Users.findOne({
				id: parsed.id,
			})) || null;
		}

		if (parsed.uri) {
			return (await Users.findOne({
				uri: parsed.uri,
			})) || null;
		}

		return null;
	}

	/**
	 * AP KeyId => Misskey User and Key
	 */
	public async getAuthUserFromKeyId(keyId: string): Promise<{
		user: CacheableRemoteUser;
		key: UserPublickey;
	} | null> {
		const key = await publicKeyCache.fetch(keyId, async () => {
			const key = await UserPublickeys.findOne({
				keyId,
			});
	
			if (key == null) return null;

			return key;
		}, key => key != null);

		if (key == null) return null;

		return {
			user: await userByIdCache.fetch(key.userId, () => Users.findOneOrFail(key.userId)) as CacheableRemoteUser,
			key,
		};
	}

	/**
	 * AP Actor id => Misskey User and Key
	 */
	public async getAuthUserFromApId(uri: string): Promise<{
		user: CacheableRemoteUser;
		key: UserPublickey | null;
	} | null> {
		const user = await resolvePerson(uri) as CacheableRemoteUser;

		if (user == null) return null;

		const key = await publicKeyByUserIdCache.fetch(user.id, () => UserPublickeys.findOne(user.id).then(x => x || null), v => v != null); // TODO: typeorm 3.0 にしたら.then(x => x || null)は消せる

		return {
			user,
			key,
		};
	}

	public parseUri(value: string | IObject): UriParseResult {
		const uri = getApId(value);

		const localRegex = new RegExp('^' + escapeRegexp(config.url) + '/' + '(\\w+)' + '/' + '(\\w+)');
		const matchLocal = uri.match(localRegex);

		if (matchLocal) {
			return {
				type: matchLocal[1],
				id: matchLocal[2],
			};
		} else {
			return {
				uri,
			};
		}
	}
}

type UriParseResult = {
	/** id in DB (local object only) */
	id?: string;
	/** uri in DB (remote object only) */
	uri?: string;
	/** hint of type (local object only, ex: notes, users) */
	type?: string
};
