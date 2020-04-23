import config from '../../config';
import { IObject, getApId } from './type';
import { Note } from '../../models/entities/note';
import { User } from '../../models/entities/user';
import { Notes, Users } from '../../models';
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

type UriParseResult = {
	/** id in DB (local object only) */
	id?: string;
	/** uri in DB (remote object only) */
	uri?: string;
	/** hint of type (local object only, ex: notes, users) */
	type?: string
};
