import define from '../../define.js';
import config from '@/config/index.js';
import { createPerson } from '@/remote/activitypub/models/person.js';
import { createNote } from '@/remote/activitypub/models/note.js';
import Resolver from '@/remote/activitypub/resolver.js';
import { ApiError } from '../../error.js';
import { extractDbHost } from '@/misc/convert-host.js';
import { Users, Notes } from '@/models/index.js';
import { Note } from '@/models/entities/note.js';
import { User } from '@/models/entities/user.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { isActor, isPost, getApId } from '@/remote/activitypub/type.js';
import ms from 'ms';
import { SchemaType } from '@/misc/schema.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	errors: {
		noSuchObject: {
			message: 'No such object.',
			code: 'NO_SUCH_OBJECT',
			id: 'dc94d745-1262-4e63-a17d-fecaa57efc82',
		},
	},

	res: {
		optional: false, nullable: false,
		oneOf: [
			{
				type: 'object',
				properties: {
					type: {
						type: 'string',
						optional: false, nullable: false,
						enum: ['User'],
					},
					object: {
						type: 'object',
						optional: false, nullable: false,
						ref: 'UserDetailedNotMe',
					}
				}
			},
			{
				type: 'object',
				properties: {
					type: {
						type: 'string',
						optional: false, nullable: false,
						enum: ['Note'],
					},
					object: {
						type: 'object',
						optional: false, nullable: false,
						ref: 'Note',
					}
				}
			}
		],
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		uri: { type: 'string' },
	},
	required: ['uri'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps) => {
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
async function fetchAny(uri: string): Promise<SchemaType<typeof meta['res']> | null> {
	// URIがこのサーバーを指しているなら、ローカルユーザーIDとしてDBからフェッチ
	if (uri.startsWith(config.url + '/')) {
		const parts = uri.split('/');
		const id = parts.pop();
		const type = parts.pop();

		if (type === 'notes') {
			const note = await Notes.findOneBy({ id });

			if (note) {
				return {
					type: 'Note',
					object: await Notes.pack(note, null, { detail: true }),
				};
			}
		} else if (type === 'users') {
			const user = await Users.findOneBy({ id });

			if (user) {
				return {
					type: 'User',
					object: await Users.pack(user, null, { detail: true }),
				};
			}
		}
	}

	// ブロックしてたら中断
	const fetchedMeta = await fetchMeta();
	if (fetchedMeta.blockedHosts.includes(extractDbHost(uri))) return null;

	// URI(AP Object id)としてDB検索
	{
		const [user, note] = await Promise.all([
			Users.findOneBy({ uri: uri }),
			Notes.findOneBy({ uri: uri }),
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
				const note = await Notes.findOneBy({ id });

				if (note) {
					return {
						type: 'Note',
						object: await Notes.pack(note, null, { detail: true }),
					};
				}
			} else if (type === 'users') {
				const user = await Users.findOneBy({ id });

				if (user) {
					return {
						type: 'User',
						object: await Users.pack(user, null, { detail: true }),
					};
				}
			}
		}

		const [user, note] = await Promise.all([
			Users.findOneBy({ uri: object.id }),
			Notes.findOneBy({ uri: object.id }),
		]);

		const packed = await mergePack(user, note);
		if (packed !== null) return packed;
	}

	// それでもみつからなければ新規であるため登録
	if (isActor(object)) {
		const user = await createPerson(getApId(object));
		return {
			type: 'User',
			object: await Users.pack(user, null, { detail: true }),
		};
	}

	if (isPost(object)) {
		const note = await createNote(getApId(object), undefined, true);
		return {
			type: 'Note',
			object: await Notes.pack(note!, null, { detail: true }),
		};
	}

	return null;
}

async function mergePack(user: User | null | undefined, note: Note | null | undefined): Promise<SchemaType<typeof meta.res> | null> {
	if (user != null) {
		return {
			type: 'User',
			object: await Users.pack(user, null, { detail: true }),
		};
	}

	if (note != null) {
		return {
			type: 'Note',
			object: await Notes.pack(note, null, { detail: true }),
		};
	}

	return null;
}
