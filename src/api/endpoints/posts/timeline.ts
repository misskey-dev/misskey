/**
 * Module dependencies
 */
import $ from 'cafy';
import rap from '@prezzemolo/rap';
import Post from '../../models/post';
import Mute from '../../models/mute';
import ChannelWatching from '../../models/channel-watching';
import getFriends from '../../common/get-friends';
import { pack } from '../../models/post';

/**
 * Get timeline of myself
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = async (params, user, app) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) throw 'invalid limit param';

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) throw 'invalid since_id param';

	// Get 'until_id' parameter
	const [untilId, untilIdErr] = $(params.until_id).optional.id().$;
	if (untilIdErr) throw 'invalid until_id param';

	// Get 'since_date' parameter
	const [sinceDate, sinceDateErr] = $(params.since_date).optional.number().$;
	if (sinceDateErr) throw 'invalid since_date param';

	// Get 'until_date' parameter
	const [untilDate, untilDateErr] = $(params.until_date).optional.number().$;
	if (untilDateErr) throw 'invalid until_date param';

	// Check if only one of since_id, until_id, since_date, until_date specified
	if ([sinceId, untilId, sinceDate, untilDate].filter(x => x != null).length > 1) {
		throw 'only one of since_id, until_id, since_date, until_date can be specified';
	}

	const { followingIds, watchingChannelIds, mutedUserIds } = await rap({
		// ID list of the user itself and other users who the user follows
		followingIds: getFriends(user._id),

		// Watchしているチャンネルを取得
		watchingChannelIds: ChannelWatching.find({
			userId: user._id,
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}).then(watches => watches.map(w => w.channelId)),

		// ミュートしているユーザーを取得
		mutedUserIds: Mute.find({
			muterId: user._id,
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}).then(ms => ms.map(m => m.muteeId))
	});

	//#region Construct query
	const sort = {
		_id: -1
	};

	const query = {
		$or: [{
			// フォローしている人のタイムラインへの投稿
			userId: {
				$in: followingIds
			},
			// 「タイムラインへの」投稿に限定するためにチャンネルが指定されていないもののみに限る
			$or: [{
				channelId: {
					$exists: false
				}
			}, {
				channelId: null
			}]
		}, {
			// Watchしているチャンネルへの投稿
			channelId: {
				$in: watchingChannelIds
			}
		}],
		// mute
		userId: {
			$nin: mutedUserIds
		},
		'_reply.userId': {
			$nin: mutedUserIds
		},
		'_repost.userId': {
			$nin: mutedUserIds
		},
	} as any;

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		query._id = {
			$lt: untilId
		};
	} else if (sinceDate) {
		sort._id = 1;
		query.createdAt = {
			$gt: new Date(sinceDate)
		};
	} else if (untilDate) {
		query.createdAt = {
			$lt: new Date(untilDate)
		};
	}
	//#endregion

	// Issue query
	const timeline = await Post
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	return await Promise.all(timeline.map(post => pack(post, user)));
};
