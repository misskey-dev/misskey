import $ from 'cafy';
import define from '../../define';
import config from '@/config';
import { createPerson } from '../../../../remote/activitypub/models/person';
import { createNote } from '../../../../remote/activitypub/models/note';
import Resolver from '../../../../remote/activitypub/resolver';
import { ApiError } from '../../error';
import { extractDbHost } from '@/misc/convert-host';
import { Users, Notes } from '../../../../models';
import { Note } from '../../../../models/entities/note';
import { User } from '../../../../models/entities/user';
import { fetchMeta } from '@/misc/fetch-meta';
import { validActor, validPost } from '../../../../remote/activitypub/type';

export const meta = {
	tags: ['federation'],

	desc: {
		'ja-JP': 'URIを指定してActivityPubオブジェクトを参照します。',
		'en-US': 'Browse to the ActivityPub object by specifying the URI.'
	},

	requireCredential: false as const,

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
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			type: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				enum: ['User', 'Note']
			},
			object: {
				type: 'object' as const,
				optional: false as const, nullable: false as const
			}
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
		const parts = uri.split('/');
		const id = parts.pop();
		const type = parts.pop();

		if (type === 'notes') {
			const note = await Notes.findOne(id);

			if (note) {
				return {
					type: 'Note',
					object: await Notes.pack(note, null, { detail: true })
				};
			}
		} else if (type === 'users') {
			const user = await Users.findOne(id);

			if (user) {
				return {
					type: 'User',
					object: await Users.pack(user, null, { detail: true })
				};
			}
		}
	}

	// ブロックしてたら中断
	const meta = await fetchMeta();
	if (meta.blockedHosts.includes(extractDbHost(uri))) return null;

	// URI(AP Object id)としてDB検索
	{
		const [user, note] = await Promise.all([
			Users.findOne({ uri: uri }),
			Notes.findOne({ uri: uri })
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
		if (object.id.startsWith(config.url + '/')) {
			const parts = object.id.split('/');
			const id = parts.pop();
			const type = parts.pop();

			if (type === 'notes') {
				const note = await Notes.findOne(id);

				if (note) {
					return {
						type: 'Note',
						object: await Notes.pack(note, null, { detail: true })
					};
				}
			} else if (type === 'users') {
				const user = await Users.findOne(id);

				if (user) {
					return {
						type: 'User',
						object: await Users.pack(user, null, { detail: true })
					};
				}
			}
		}

		const [user, note] = await Promise.all([
			Users.findOne({ uri: object.id }),
			Notes.findOne({ uri: object.id })
		]);

		const packed = await mergePack(user, note);
		if (packed !== null) return packed;
	}

	// それでもみつからなければ新規であるため登録
	if (validActor.includes(object.type)) {
		const user = await createPerson(object.id);
		return {
			type: 'User',
			object: await Users.pack(user, null, { detail: true })
		};
	}

	if (validPost.includes(object.type)) {
		const note = await createNote(object.id, undefined, true);
		return {
			type: 'Note',
			object: await Notes.pack(note!, null, { detail: true })
		};
	}

	return null;
}

async function mergePack(user: User | null | undefined, note: Note | null | undefined) {
	if (user != null) {
		return {
			type: 'User',
			object: await Users.pack(user, null, { detail: true })
		};
	}

	if (note != null) {
		return {
			type: 'Note',
			object: await Notes.pack(note, null, { detail: true })
		};
	}

	return null;
}
