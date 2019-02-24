import $ from 'cafy';
import define from '../../define';
import config from '../../../../config';
import * as mongo from 'mongodb';
import User, { pack as packUser, IUser } from '../../../../models/user';
import { createPerson } from '../../../../remote/activitypub/models/person';
import Note, { pack as packNote, INote } from '../../../../models/note';
import { createNote } from '../../../../remote/activitypub/models/note';
import Resolver from '../../../../remote/activitypub/resolver';
import { ApiError } from '../../error';

export const meta = {
	tags: ['federation'],

	desc: {
		'ja-JP': 'URIを指定してActivityPubオブジェクトを参照します。'
	},

	requireCredential: false,

	params: {
		uri: {
			validator: $.str,
			desc: {
				'ja-JP': 'ActivityPubオブジェクトのURI'
			}
		},
	},

	errors: {
		noSuchObject: {
			message: 'No such object.',
			code: 'NO_SUCH_OBJECT',
			id: 'dc94d745-1262-4e63-a17d-fecaa57efc82'
		}
	}
};

export default define(meta, async (ps) => {
	const object = await fetchAny(ps.uri);
	if (object) {
		return object;
	} else {
		throw new ApiError(meta.errors.noSuchObject);
	}
});

/***
 * URIからUserかNoteを解決する
 */
async function fetchAny(uri: string) {
	// URIがこのサーバーを指しているなら、ローカルユーザーIDとしてDBからフェッチ
	if (uri.startsWith(config.url + '/')) {
		const id = new mongo.ObjectID(uri.split('/').pop());
		const [user, note] = await Promise.all([
			User.findOne({ _id: id }),
			Note.findOne({ _id: id })
		]);

		const packed = await mergePack(user, note);
		if (packed !== null) return packed;
	}

	// URI(AP Object id)としてDB検索
	{
		const [user, note] = await Promise.all([
			User.findOne({ uri: uri }),
			Note.findOne({ uri: uri })
		]);

		const packed = await mergePack(user, note);
		if (packed !== null) return packed;
	}

	// リモートから一旦オブジェクトフェッチ
	const resolver = new Resolver();
	const object = await resolver.resolve(uri) as any;

	// /@user のような正規id以外で取得できるURIが指定されていた場合、ここで初めて正規URIが確定する
	// これはDBに存在する可能性があるため再度DB検索
	if (uri !== object.id) {
		const [user, note] = await Promise.all([
			User.findOne({ uri: object.id }),
			Note.findOne({ uri: object.id })
		]);

		const packed = await mergePack(user, note);
		if (packed !== null) return packed;
	}

	// それでもみつからなければ新規であるため登録
	if (object.type === 'Person') {
		const user = await createPerson(object.id);
		return {
			type: 'User',
			object: await packUser(user, null, { detail: true })
		};
	}

	if (object.type === 'Note') {
		const note = await createNote(object.id);
		return {
			type: 'Note',
			object: await packNote(note, null, { detail: true })
		};
	}

	return null;
}

async function mergePack(user: IUser, note: INote) {
	if (user !== null) {
		return {
			type: 'User',
			object: await packUser(user, null, { detail: true })
		};
	}

	if (note !== null) {
		return {
			type: 'Note',
			object: await packNote(note, null, { detail: true })
		};
	}

	return null;
}
