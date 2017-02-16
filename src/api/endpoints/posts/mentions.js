'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Post from '../../models/post';
import getFriends from '../../common/get-friends';
import serialize from '../../serializers/post';

/**
 * Get mentions of myself
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'following' parameter
	const following = params.following;

	// Get 'limit' parameter
	let limit = params.limit;
	if (limit !== undefined && limit !== null) {
		limit = parseInt(limit, 10);

		// From 1 to 100
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

	const since = params.since_id || null;
	const max = params.max_id || null;

	// Check if both of since_id and max_id is specified
	if (since !== null && max !== null) {
		return rej('cannot set since_id and max_id');
	}

	// Construct query
	const query = {
		mentions: user._id
	};

	const sort = {
		_id: -1
	};

	if (following) {
		const followingIds = await getFriends(user._id);

		query.user_id = {
			$in: followingIds
		};
	}

	if (since) {
		sort._id = 1;
		query._id = {
			$gt: new mongo.ObjectID(since)
		};
	} else if (max) {
		query._id = {
			$lt: new mongo.ObjectID(max)
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
