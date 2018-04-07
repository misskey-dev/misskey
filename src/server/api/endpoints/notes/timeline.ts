/**
 * Module dependencies
 */
import $ from 'cafy';
import rap from '@prezzemolo/rap';
import Note from '../../../../models/note';
import Mute from '../../../../models/mute';
import ChannelWatching from '../../../../models/channel-watching';
import getFriends from '../../common/get-friends';
import { pack } from '../../../../models/note';

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

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.id().$;
	if (sinceIdErr) throw 'invalid sinceId param';

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.id().$;
	if (untilIdErr) throw 'invalid untilId param';

	// Get 'sinceDate' parameter
	const [sinceDate, sinceDateErr] = $(params.sinceDate).optional.number().$;
	if (sinceDateErr) throw 'invalid sinceDate param';

	// Get 'untilDate' parameter
	const [untilDate, untilDateErr] = $(params.untilDate).optional.number().$;
	if (untilDateErr) throw 'invalid untilDate param';

	// Check if only one of sinceId, untilId, sinceDate, untilDate specified
	if ([sinceId, untilId, sinceDate, untilDate].filter(x => x != null).length > 1) {
		throw 'only one of sinceId, untilId, sinceDate, untilDate can be specified';
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
		'_renote.userId': {
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
	const timeline = await Note
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	return await Promise.all(timeline.map(note => pack(note, user)));
};
