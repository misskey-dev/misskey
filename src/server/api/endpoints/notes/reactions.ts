import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Reaction, { pack } from '../../../../models/note-reaction';
import define from '../../define';
import { error, errorWhen } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿のリアクション一覧を取得します。',
		'en-US': 'Show reactions of a note.'
	},

	requireCredential: false,

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'The ID of the target note'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional,
			default: 0
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},
	}
};

export default define(meta, (ps, user) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => Note.findOne({ _id: ps.noteId }))
	.then(x =>
		x === null ? error('note not found') :
		Reaction.find({
				_id:
					ps.sinceId ? { $gt: ps.sinceId } :
					ps.untilId ? { $lt: ps.untilId } : undefined,
				noteId: x._id
			}, {
				limit: ps.limit,
				skip: ps.offset,
				sort: { _id: ps.sinceId ? 1 : -1 }
			}))
	.then(x => Promise.all(x.map(x => pack(x, user)))));
