'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Post from '../../models/post';
import User from '../../models/user';
import serialize from '../../serializers/post';

/**
 * Get posts of a user
 *
 * @param {Object} params
 * @param {Object} me
 * @return {Promise<object>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	const userId = params.user_id;
	if (userId === undefined || userId === null) {
		return rej('user_id is required');
	}

	// Get 'with_replies' parameter
	let withReplies = params.with_replies;
	if (withReplies !== undefined && withReplies !== null && withReplies === 'true') {
		withReplies = true;
	} else {
		withReplies = false;
	}

	// Get 'with_media' parameter
	let withMedia = params.with_media;
	if (withMedia !== undefined && withMedia !== null && withMedia === 'true') {
		withMedia = true;
	} else {
		withMedia = false;
	}

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

	// Lookup user
	const user = await User.findOne({
		_id: new mongo.ObjectID(userId)
	});

	if (user === null) {
		return rej('user not found');
	}

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		user_id: user._id
	};
	if (since !== null) {
		sort._id = 1;
		query._id = {
			$gt: new mongo.ObjectID(since)
		};
	} else if (max !== null) {
		query._id = {
			$lt: new mongo.ObjectID(max)
		};
	}

	if (!withReplies) {
		query.reply_to_id = null;
	}

	if (withMedia) {
		query.media_ids = {
			$exists: true,
			$ne: null
		};
	}

	// Issue query
	const posts = await Post
		.find(query, {}, {
			limit: limit,
			sort: sort
		})
		.toArray();

	// Serialize
	res(await Promise.all(posts.map(async (post) =>
		await serialize(post, me)
	)));
});
