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
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	let userId = params.user_id;
	if (userId === undefined || userId === null || userId === '') {
		userId = null;
	}

	// Get 'username' parameter
	let username = params.username;
	if (username === undefined || username === null || username === '') {
		username = null;
	}

	if (userId === null && username === null) {
		return rej('user_id or username is required');
	}

	// Get 'with_replies' parameter
	let withReplies = params.with_replies;
	if (withReplies == null) {
		withReplies = true;
	}

	// Get 'with_media' parameter
	let withMedia = params.with_media;
	if (withMedia == null) {
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

	const q = userId != null
		? { _id: new mongo.ObjectID(userId) }
		: { username_lower: username.toLowerCase() } ;

	// Lookup user
	const user = await User.findOne(q, {
		fields: {
			_id: true
		}
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
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(posts.map(async (post) =>
		await serialize(post, me)
	)));
});
