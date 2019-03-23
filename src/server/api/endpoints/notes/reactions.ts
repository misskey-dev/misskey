import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import NoteReaction, { pack } from '../../../../models/entities/note-reaction';
import define from '../../define';
import { getNote } from '../../common/getters';
import { ApiError } from '../../error';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のリアクション一覧を取得します。',
		'en-US': 'Show reactions of a note.'
	},

	tags: ['notes', 'reactions'],

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(StringID),
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'The ID of the target note'
			}
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
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),
		},
	},

	res: {
		type: 'array',
		items: {
			type: 'Reaction'
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
	} as any;

	const sort = {
		id: -1
	};

	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	}

	const reactions = await NoteReaction.find(query, {
		take: ps.limit,
		skip: ps.offset,
		sort: sort
	});

	return await Promise.all(reactions.map(reaction => pack(reaction, user)));
});
