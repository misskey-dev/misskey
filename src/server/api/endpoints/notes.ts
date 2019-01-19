import $ from 'cafy'; import ID, { transform } from '../../../misc/cafy-id';
import Note, { packMany } from '../../../models/note';
import define from '../define';
import { errorWhen } from '../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '投稿を取得します。'
	},

	params: {
		local: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'ローカルの投稿に限定するか否か'
			}
		},

		reply: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': '返信に限定するか否か'
			}
		},

		renote: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'Renoteに限定するか否か'
			}
		},

		withFiles: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か'
			}
		},

		media: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'ファイルが添付された投稿に限定するか否か (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},

		poll: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'アンケートが添付された投稿に限定するか否か'
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
		},
	}
};

export default define(meta, ps => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => Note.find({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			['_user.host']: ps.local ? null : undefined,
			replyId:
				ps.reply ? { $exists: true, $ne: null } :
				ps.reply === false ? null : undefined,
			renoteId:
				ps.renote ? { $exists: true, $ne: null } :
				ps.renote === false ? null : undefined,
			fileIds: ps.withFiles !== false || ps.media ? { $exists: true, $ne: null } : undefined,
			poll:
				ps.poll ? { $exists: true, $ne: null } :
				ps.poll === false ? null : undefined
		}, {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? 1 : -1 }
		}))
	.then(packMany));
