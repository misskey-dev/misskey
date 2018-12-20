import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/note';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿への返信を取得します。',
		'en-US': 'Get replies of a note.'
	},

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {

	const notes = await Note.find({
			replyId: ps.noteId
		}, {
			limit: ps.limit,
			skip: ps.offset
		});

	res(await packMany(notes, user));
}));
