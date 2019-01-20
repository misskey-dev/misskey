import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import { packMany } from '../../../../models/note';
import UserList from '../../../../models/user-list';
import define from '../../define';
import { query } from '../../../../prelude/query';
import { getFriends } from '../../common/get-friends';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストのタイムラインを取得します。',
		'en-US': 'Get timeline of a user list.'
	},

	requireCredential: true,

	params: {
		listId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': 'リストのID'
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
			desc: {
				'ja-JP': 'true にすると、ファイルが添付された投稿だけ取得します'
			}
		}
	}
};

export default define(meta, (ps, user) => Promise.all([
		UserList.findOne({
			_id: ps.listId,
			userId: user._id
		}),
		getFriends(user._id, true, false)
			.then(x => x.map(x => x.id)),
		Mute.find({ muterId: user._id })
			.then(ms => ms.map(m => m.muteeId))
	])
	.then(([list, $in, $nin]) =>
		!list.userIds.length ? [] :
		Note.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			createdAt:
				ps.sinceDate ? { $gt: new Date(ps.sinceDate) } :
				ps.untilDate ? { $lt: new Date(ps.untilDate) } : undefined,
			$and: [{
				deletedAt: null,
				$and: [{
					$or: list.userIds.map(userId => ({
						userId,
						$or: [
							{ replyId: null }, {
								$expr: { $eq: ['$_reply.userId', '$userId'] }
							}, { '_reply.userId': user._id },
							{ userId: user._id }
						]
					}))
				}, {
					$or: [
						{
							visibility: { $in: ['public', 'home'] }
						},
						{ userId: user._id },
						{
							visibleUserIds: { $in: [user._id] }
						},
						{
							visibility: 'followers',
							userId: { $in }
						}
					]
				}],
				userId: { $nin },
				'_reply.userId': { $nin },
				'_renote.userId': { $nin },
			},
			...(ps.includeMyRenotes === false ? [{
				$or: [{
					userId: { $ne: user._id }
				}, { renoteId: null }, {
					text: { $ne: null }
				}, {
					fileIds: { $ne: [] }
				}, {
					poll: { $ne: null }
				}]
			}] : []),
			...(ps.includeRenotedMyNotes === false ? [{
				$or: [{
					'_renote.userId': { $ne: user._id }
				}, { renoteId: null }, {
					text: { $ne: null }
				}, {
					fileIds: { $ne: [] }
				}, {
					poll: { $ne: null }
				}]
			}] : []),
			...(ps.includeLocalRenotes === false ? [{
				$or: [{
					'_renote.user.host': { $ne: null }
				}, { renoteId: null }, {
					text: { $ne: null }
				}, {
					fileIds: { $ne: [] }
				}, {
					poll: { $ne: null }
				}]
			}] : []),
			...(ps.withFiles ? [{
				fileIds: { $exists: true, $ne: [] }
			}] : [])]
		}), {
			limit: ps.limit,
			sort: { _id: ps.sinceId || ps.sinceDate ? 1 : -1 }
		}))
	.then(x => packMany(x, user)));
