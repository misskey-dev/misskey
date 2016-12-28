'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Post from '../../models/post';
import serialize from '../../serializers/post';

/**
 * Show a context of a post
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'post_id' parameter
	const postId = params.post_id;
	if (postId === undefined || postId === null) {
		return rej('post_id is required');
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

	// Get 'offset' parameter
	let offset = params.offset;
	if (offset !== undefined && offset !== null) {
		offset = parseInt(offset, 10);
	} else {
		offset = 0;
	}

	// Lookup post
	const post = await Post.findOne({
		_id: new mongo.ObjectID(postId)
	});

	if (post === null) {
		return rej('post not found', 'POST_NOT_FOUND');
	}

	const context = [];
	let i = 0;

	async function get(id) {
		i++;
		const p = await Post.findOne({ _id: id });

		if (i > offset) {
			context.push(p);
		}

		if (context.length == limit) {
			return;
		}

		if (p.reply_to_id) {
			await get(p.reply_to_id);
		}
	}

	if (post.reply_to_id) {
		await get(post.reply_to_id);
	}

	// Serialize
	res(await Promise.all(context.map(async post =>
		await serialize(post, user))));
});
