import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany, INote } from '../../../../models/note';
import define from '../../define';
import { error } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿の文脈を取得します。',
		'en-US': 'Show conversation of a note.'
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

export default define(meta, (ps, user) => Note.findOne({ _id: ps.noteId })
	.then(x =>
		x === null ? error('note not found') :
		(Array(ps.limit + ps.offset) as INote[] /* TypeScript's bug? */).reduce(
				(a, _, i) => a.then(b => b[i].replyId ? Note.findOne({ _id: b[i].replyId })
					.then(x => [ ...b, x ]) : b),
				Promise.resolve([x])))
	.then(x => x.splice(ps.offset))
	.then(x => packMany(x, user)));
