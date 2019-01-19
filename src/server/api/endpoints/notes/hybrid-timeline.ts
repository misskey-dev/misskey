import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { getFriends } from '../../common/get-friends';
import { packMany } from '../../../../models/note';
import define from '../../define';
import { error } from '../../../../prelude/promise';
import fetchMeta from '../../../../misc/fetch-meta';
import activeUsersChart from '../../../../chart/active-users';

export const meta = {
	desc: {
		'ja-JP': 'ハイブリッドタイムラインを取得します。'
	},

	params: {
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
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		},

		mediaOnly: {
			validator: $.bool.optional,
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します (このパラメータは廃止予定です。代わりに withFiles を使ってください。)'
			}
		},
	}
};

export default define(meta, (ps, user) => fetchMeta()
	.then(({ disableLocalTimeline }) =>
		[ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate].filter(x => x).length > 1 ?
			error('only one of sinceId, untilId, sinceDate, untilDate can be specified') :
		disableLocalTimeline && !user.isAdmin && !user.isModerator ?
			error('local timeline disabled') :
			Promise.all([
				getFriends(user._id, true, false),
				Mute.find({ muterId: user._id })
					.then(ms => ms.map(m => m.muteeId))
			]))
	.then(([followings, $nin]) => Note.find({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			createdAt:
				ps.sinceDate ? { $gt: new Date(ps.sinceDate) } :
				ps.untilDate ? { $lt: new Date(ps.untilDate) } : undefined,
			$and: [{
				deletedAt: null,
				$or: [{
					$or: followings.map(x => ({
						userId: x.id,
						$and: [{
							$or: x.stalk ? [{ replyId: null }, {
								$expr: { $eq: ['$_reply.userId', '$userId'] }
							}, { '_reply.userId': user._id }, { userId: user._id }] : undefined
						}, {
							$or: [{
								visibility: { $in: [ 'public', 'home' ] }
							},
							...(user ? [{ userId: user._id }, {
								visibleUserIds: { $in: [ user._id ] }
							}] : [])]
						}]
					}))
				}, {
					visibility: 'public',
					'_user.host': null
				}],
				userId: { $nin },
				'_reply.userId': { $nin },
				'_renote.userId': { $nin },
			}, ...(ps.includeMyRenotes === false ? [{
				$or: [{
					userId: { $ne: user._id }
				}, { renoteId: null }, {
					text: { $ne: null }
				}, {
					fileIds: { $ne: [] }
				}, {
					poll: { $ne: null }
				}]
			}] : []), ...(ps.includeRenotedMyNotes === false ? [{
				$or: [{
					'_renote.userId': { $ne: user._id }
				}, { renoteId: null }, {
					text: { $ne: null }
				}, {
					fileIds: { $ne: [] }
				}, {
					poll: { $ne: null }
				}]
			}] : []), ...(ps.includeLocalRenotes === false ? [{
				$or: [{
					'_renote.user.host': { $ne: null }
				}, { renoteId: null }, {
					text: { $ne: null }
				}, {
					fileIds: { $ne: [] }
				}, {
					poll: { $ne: null }
				}]
			}] : []), ...(ps.withFiles !== false || ps.mediaOnly ? [{
				fileIds: {
					$exists: true,
					$ne: []
				}
			}] : [])]
		}, {
			limit: ps.limit,
			sort: { _id: ps.sinceId || ps.sinceDate ? 1 : -1 }
		}))
	.then(x => packMany(x, user))
	.finally(() => activeUsersChart.update(user)));
