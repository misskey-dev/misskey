/**
 * Module dependencies
 */
import it from 'cafy';
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
	const [limit = 10, limitErr] = it(params.limit).expect.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = it(params.since_id).expect.id().get();
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = it(params.max_id).expect.id().get();
	if (maxIdErr) return rej('invalid max_id param');

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		return rej('cannot set since_id and max_id');
	}

	// ID list of the user itself and other users who the user follows
	const followingIds = await getFriends(user._id);

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		user_id: {
			$in: followingIds
		}
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
