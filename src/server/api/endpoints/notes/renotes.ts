import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/note';
import define from '../../define';
import { error, errorWhen } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のRenote一覧を取得します。',
		'en-US': 'Show a renotes of a note.'
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

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		}
	}
};

export default define(meta, (ps, user) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => Note.findOne({ _id: ps.noteId }))
	.then(x =>
		x === null ? error('note not found') :
		Note.find({
				_id:
					ps.sinceId ? { $gt: ps.sinceId } :
					ps.untilId ? { $lt: ps.untilId } : undefined,
				renoteId: x._id
			}, {
				limit: ps.limit,
				sort: { _id: ps.sinceId ? 1 : -1 }
			}))
	.then(x => packMany(x, user)));
