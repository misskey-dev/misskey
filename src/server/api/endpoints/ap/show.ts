import $ from 'cafy';
import getParams from '../../get-params';
import config from '../../../../config';
import * as mongo from 'mongodb';
import User, { pack as packUser, IUser } from '../../../../models/user';
import { createPerson } from '../../../../remote/activitypub/models/person';
import Note, { pack as packNote, INote } from '../../../../models/note';
import { createNote } from '../../../../remote/activitypub/models/note';
import Resolver from '../../../../remote/activitypub/resolver';

export const meta = {
	desc: {
		'ja-JP': 'URIを指定してActivityPubオブジェクトを参照します。'
	},

	requireCredential: false,

	params: {
		uri: $.str.note({
			desc: {
				'ja-JP': 'ActivityPubオブジェクトのURI'
			}
		}),
	},
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const object = await fetchAny(ps.uri);
	if (object !== null) return res(object);

	return rej('object not found');
});

/***
 * URIからUserかNoteを解決する
 */
async function fetchAny(uri: string) {
	// URIがこのサーバーを指しているなら、ローカルユーザーIDとしてDBからフェッチ
	if (uri.startsWith(config.url + '/')) {
		const id = new mongo.ObjectID(uri.split('/').pop());
		const [ user, note ] = await Promise.all([
			User.findOne({ _id: id }),
			Note.findOne({ _id: id })
		]);

		const packed = await mergePack(user, note);
		if (packed !== null) return packed;
	}

	// URI(AP Object id)としてDB検索
	{
		const [ user, note ] = await Promise.all([
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
		const [ user, note ] = await Promise.all([
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
			object: user
		};
	}

	if (object.type === 'Note') {
		const note = await createNote(object.id);
		return {
			type: 'Note',
			object: note
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
