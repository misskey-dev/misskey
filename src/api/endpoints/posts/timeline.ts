/**
 * Module dependencies
 */
import $ from 'cafy';
import Post from '../../models/post';
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
module.exports = (params, user, app) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = $(params.max_id).optional.id().$;
	if (maxIdErr) return rej('invalid max_id param');

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		return rej('cannot set since_id and max_id');
	}

	// ID list of the user $self and other users who the user follows
	const followingIds = await getFriends(user._id);

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		user_id: {
			$in: followingIds
		},
		// TODO
		$or: [{
			channel_id: {
				$exists: false
			}
		}, {
			channel_id: null
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

	// Issue query
	const timeline = await Post
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(timeline.map(async post =>
		await serialize(post, user)
	)));
});
