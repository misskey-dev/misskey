import $ from 'cafy';
import { StringID, NumericalID } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/entities/note';
import define from '../../define';
import { getNote } from '../../common/getters';
import { ApiError } from '../../error';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のRenote一覧を取得します。',
		'en-US': 'Show a renotes of a note.'
	},

	tags: ['notes'],

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(StringID),
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(NumericalID),
		},

		untilId: {
			validator: $.optional.type(NumericalID),
		}
	},

	res: {
		type: 'array',
		items: {
			type: 'Note',
		},
	},

	errors: {
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: '12908022-2e21-46cd-ba6a-3edaf6093f46'
		}
	}
};

export default define(meta, async (ps, user) => {
	const note = await getNote(ps.noteId).catch(e => {
		if (e.id === '9725d0ce-ba28-4dde-95a7-2cbb2c15de24') throw new ApiError(meta.errors.noSuchNote);
		throw e;
	});

	const sort = {
		id: -1
	};

	const query = {
		renoteId: note.id
	} as any;

	if (ps.sinceId) {
		sort.id = 1;
		query.id = MoreThan(ps.sinceId);
	} else if (ps.untilId) {
		query.id = LessThan(ps.untilId);
	}

	const renotes = await Note.find(query, {
		take: ps.limit,
		sort: sort
	});

	return await packMany(renotes, user);
});
