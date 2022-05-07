import { DeepPartial, FindOptionsWhere } from 'typeorm';
import { NoteReactions } from '@/models/index.js';
import { NoteReaction } from '@/models/entities/note-reaction.js';
import define from '../../define.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['notes', 'reactions'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'NoteReaction',
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '263fff3d-d0e1-4af4-bea7-8408059b451a',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		type: { type: 'string', nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: ['noteId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const query = {
		noteId: ps.noteId,
	} as FindOptionsWhere<NoteReaction>;

	if (ps.type) {
		// ローカルリアクションはホスト名が . とされているが
		// DB 上ではそうではないので、必要に応じて変換
		const suffix = '@.:';
		const type = ps.type.endsWith(suffix) ? ps.type.slice(0, ps.type.length - suffix.length) + ':' : ps.type;
		query.reaction = type;
	}

	const reactions = await NoteReactions.find({
		where: query,
		take: ps.limit,
		skip: ps.offset,
		order: {
			id: -1,
		},
		relations: ['user', 'user.avatar', 'user.banner', 'note'],
	});

	return await Promise.all(reactions.map(reaction => NoteReactions.pack(reaction, user)));
});
