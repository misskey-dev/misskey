/**
 * Module dependencies
 */
import $ from 'cafy';
import rap from '@prezzemolo/rap';
import Post from '../../models/post';
import ChannelWatching from '../../models/channel-watching';
import getFriends from '../../common/get-friends';
import serialize from '../../serializers/post';

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

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = $(params.max_id).optional.id().$;
	if (maxIdErr) throw 'invalid max_id param';

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		throw 'cannot set since_id and max_id';
	}

	const { followingIds, watchChannelIds } = await rap({
		// ID list of the user itself and other users who the user follows
		followingIds: getFriends(user._id),
		// Watchしているチャンネルを取得
		watchChannelIds: ChannelWatching.find({
			user_id: user._id,
			// 削除されたドキュメントは除く
			deleted_at: { $exists: false }
		}).then(watches => watches.map(w => w.channel_id))
	});

	//#region Construct query
	const sort = {
		_id: -1
	};

	const query = {
		$or: [{
			// フォローしている人のタイムラインへの投稿
			user_id: {
				$in: followingIds
			},
			// 「タイムラインへの」投稿に限定するためにチャンネルが指定されていないもののみに限る
			$or: [{
				channel_id: {
					$exists: false
				}
			}, {
				channel_id: null
			}]
		}, {
			// Watchしているチャンネルへの投稿
			channel_id: {
				$in: watchChannelIds
			}
		}]
	} as any;

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (maxId) {
		query._id = {
			$lt: maxId
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
	const _timeline = await Promise.all(timeline.map(post => serialize(post, user)));
	return _timeline;
};
