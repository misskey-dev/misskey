import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import getHostLower from '../../common/get-host-lower';
import Note, { packMany } from '../../../../models/note';
import User from '../../../../models/user';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';
import { query } from '../../../../prelude/query';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのタイムラインを取得します。'
	},

	params: {
		userId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		username: {
			validator: $.str.optional,
			desc: {
				'ja-JP': 'ユーザー名'
			}
		},

		host: {
			validator: $.str.optional.nullable,
		},

		includeReplies: {
			validator: $.bool.optional,
			default: true,

			desc: {
				'ja-JP': 'リプライを含めるか否か'
			}
		},

		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '最大数'
			}
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより新しい投稿を取得します'
			}
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
			desc: {
				'ja-JP': '指定すると、この投稿を基点としてより古い投稿を取得します'
			}
		},

		sinceDate: {
			validator: $.num.optional,
			desc: {
				'ja-JP': '指定した時間を基点としてより新しい投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		},

		untilDate: {
			validator: $.num.optional,
			desc: {
				'ja-JP': '指定した時間を基点としてより古い投稿を取得します。数値は、1970年1月1日 00:00:00 UTC から指定した日時までの経過時間をミリ秒単位で表します。'
			}
		},

		includeMyRenotes: {
			validator: $.bool.optional,
			default: true,
			desc: {
				'ja-JP': '自分の行ったRenoteを含めるかどうか'
			}
		},

		includeRenotedMyNotes: {
			validator: $.bool.optional,
			default: true,
			desc: {
				'ja-JP': 'Renoteされた自分の投稿を含めるかどうか'
			}
		},

		includeLocalRenotes: {
			validator: $.bool.optional,
			default: true,
			desc: {
				'ja-JP': 'Renoteされたローカルの投稿を含めるかどうか'
			}
		},

		withFiles: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		},

		mediaOnly: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},

		fileType: {
			validator: $.arr($.str).optional,
			desc: {
				'ja-JP': '指定された種類のファイルが添付された投稿のみを取得します'
			}
		},

		excludeNsfw: {
			validator: $.bool.optional,
			default: false,
			desc: {
				'ja-JP': 'true にすると、NSFW指定されたファイルを除外します(fileTypeが指定されている場合のみ有効)'
			}
		},
	}
};

export default define(meta, (ps, me) => errorWhen(
	ps.userId === undefined && ps.username === undefined,
	'userId or username is required')
	.then(() => errorWhen(
		[ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate].filter(x => x).length > 1,
		'only one of sinceId, untilId, sinceDate, untilDate can be specified'))
	.then(() => User.findOne(ps.userId ?
		{ _id: ps.userId } : {
			usernameLower: ps.username.toLowerCase(),
			host: getHostLower(ps.host)
		}, {
			fields: { _id: true }
		}))
	.then(x => errorWhen(
		x === null,
		'user not found',
		x)
	.then(x => Note.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			createdAt:
				ps.sinceDate ? { $gt: new Date(ps.sinceDate) } :
				ps.untilDate ? { $lt: new Date(ps.untilDate) } : undefined,
			$and: [{
			},
			...(ps.includeMyRenotes === false ? [{
				$or: [{
					userId: { $ne: x._id }
				}, { renoteId: null }, {
					text: { $ne: null }
				}, {
					fileIds: { $ne: [] }
				}, {
					poll: { $ne: null }
				}]
			}] : [])],
			$or: [{
				visibility: { $in: ['public', 'home'] }
			}, ...(me ? [{ userId: me._id }, {
				visibleUserIds: { $in: [ me._id ] }
			}] : [])],
			deletedAt: null,
			userId: x._id,
			replyId: ps.includeReplies ? undefined : null,
			fileIds: ps.fileType || ps.withFiles !== false || ps.mediaOnly ? {
				$exists: true,
				$ne: []
			} : undefined,
			'_files.contentType': { $in: ps.fileType },
			'_files.metadata.isSensitive': ps.excludeNsfw ? { $ne: true } : null
		}), {
			limit: ps.limit,
			sort: {
				_id: ps.sinceId ? 1 : -1,
				createdAt: ps.sinceDate ? 1 : -1
			}
		}))
	.then(x => packMany(x, me))));
