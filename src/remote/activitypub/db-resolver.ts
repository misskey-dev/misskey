import config from '@/config';
import { Note } from '../../models/entities/note';
import { User, IRemoteUser } from '../../models/entities/user';
import { UserPublickey } from '../../models/entities/user-publickey';
import { MessagingMessage } from '../../models/entities/messaging-message';
import { Notes, Users, UserPublickeys, MessagingMessages } from '../../models';
import { IObject, getApId } from './type';
import { resolvePerson } from './models/person';
import escapeRegexp = require('escape-regexp');

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
				id: parsed.id
			})) || null;
		}

		if (parsed.uri) {
			return (await Notes.findOne({
				uri: parsed.uri
			})) || null;
		}

		return null;
	}

	public async getMessageFromApId(value: string | IObject): Promise<MessagingMessage | null> {
		const parsed = this.parseUri(value);

		if (parsed.id) {
			return (await MessagingMessages.findOne({
				id: parsed.id
			})) || null;
		}

		if (parsed.uri) {
			return (await MessagingMessages.findOne({
				uri: parsed.uri
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
				id: parsed.id
			})) || null;
		}

		if (parsed.uri) {
			return (await Users.findOne({
				uri: parsed.uri
			})) || null;
		}

		return null;
	}

	/**
	 * AP KeyId => Misskey User and Key
	 */
	public async getAuthUserFromKeyId(keyId: string): Promise<AuthUser | null> {
		const key = await UserPublickeys.findOne({
			keyId
		});

		if (key == null) return null;

		const user = await Users.findOne(key.userId) as IRemoteUser;

		return {
			user,
			key
		};
	}

	/**
	 * AP Actor id => Misskey User and Key
	 */
	public async getAuthUserFromApId(uri: string): Promise<AuthUser | null> {
		const user = await resolvePerson(uri) as IRemoteUser;

		if (user == null) return null;

		const key = await UserPublickeys.findOne(user.id);

		return {
			user,
			key
		};
	}

	public parseUri(value: string | IObject): UriParseResult {
		const uri = getApId(value);

		const localRegex = new RegExp('^' + escapeRegexp(config.url) + '/' + '(\\w+)' + '/' + '(\\w+)');
		const matchLocal = uri.match(localRegex);

		if (matchLocal) {
			return {
				type: matchLocal[1],
				id: matchLocal[2]
			};
		} else {
			return {
				uri
			};
		}
	}
}

export type AuthUser = {
	user: IRemoteUser;
	key?: UserPublickey;
};

type UriParseResult = {
	/** id in DB (local object only) */
	id?: string;
	/** uri in DB (remote object only) */
	uri?: string;
	/** hint of type (local object only, ex: notes, users) */
	type?: string
};
