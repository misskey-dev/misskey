'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import Post from '../../models/post';
import getFriends from '../../common/get-friends';
import serialize from '../../serializers/post';

/**
 * Get mentions of myself
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'following' parameter
	const [following, followingError] =
		it(params.following).expect.boolean().default(false).qed();
	if (followingError) return rej('invalid following param');

	// Get 'limit' parameter
	const [limit, limitErr] = it(params.limit).expect.number().range(1, 100).default(10).qed();
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = it(params.since_id).expect.id().qed();
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = it(params.max_id).expect.id().qed();
	if (maxIdErr) return rej('invalid max_id param');

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		return rej('cannot set since_id and max_id');
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

		query.user_id = {
			$in: followingIds
		};
	}

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
	const mentions = await Post
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(mentions.map(async mention =>
		await serialize(mention, user)
	)));
});
