/**
 * Module dependencies
 */
import $ from 'cafy';
import Post from '../../models/post';
import getFriends from '../../common/get-friends';
import { pack } from '../../models/post';

/**
 * Get mentions of myself
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'following' parameter
	const [following = false, followingError] =
		$(params.following).optional.boolean().$;
	if (followingError) return rej('invalid following param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.id().$;
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.id().$;
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// Construct query
	const query = {
		mentions: user._id
	} as any;

	const sort = {
		_id: -1
	};

	if (following) {
		const followingIds = await getFriends(user._id);

		query.userId = {
			$in: followingIds
		};
	}

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		query._id = {
			$lt: untilId
		};
	}

	// Issue query
	const mentions = await Post
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(mentions.map(async mention =>
		await pack(mention, user)
	)));
});
