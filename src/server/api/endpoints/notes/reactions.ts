import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { getNote } from '../../common/getters';
import { ApiError } from '../../error';
import { NoteReactions } from '@/models/index';
import { DeepPartial } from 'typeorm';
import { NoteReaction } from '@/models/entities/note-reaction';

export const meta = {
	tags: ['notes', 'reactions'],

	requireCredential: false as const,

	params: {
		noteId: {
			validator: $.type(ID),
		},

		type: {
			validator: $.optional.nullable.str,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num,
			default: 0
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'NoteReaction',
		}
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '263fff3d-d0e1-4af4-bea7-8408059b451a'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const query = {
		noteId: note.id
	} as DeepPartial<NoteReaction>;

	if (ps.type) {
		// ローカルリアクションはホスト名が . とされているが
		// DB 上ではそうではないので、必要に応じて変換
		const suffix = '@.:';
		const type = ps.type.endsWith(suffix) ? ps.type.slice(0, ps.type.length - suffix.length) + ':' : ps.type;
		query.reaction = type;
	}

	const reactions = await NoteReactions.find({
		where: query,
		take: ps.limit!,
		skip: ps.offset,
		order: {
			id: -1
		}
	});

	return await Promise.all(reactions.map(reaction => NoteReactions.pack(reaction, user)));
});
