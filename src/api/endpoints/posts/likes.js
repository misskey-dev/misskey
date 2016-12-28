'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Post from '../../models/post';
import Like from '../../models/like';
import serialize from '../../serializers/user';

/**
 * Show a likes of a post
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

	// Get 'sort' parameter
	let sort = params.sort || 'desc';

	// Lookup post
	const post = await Post.findOne({
		_id: new mongo.ObjectID(postId)
	});

	if (post === null) {
		return rej('post not found');
	}

	// Issue query
	const likes = await Like
		.find({
			post_id: post._id,
			deleted_at: { $exists: false }
		}, {}, {
			limit: limit,
			skip: offset,
			sort: {
				_id: sort == 'asc' ? 1 : -1
			}
		})
		.toArray();

	// Serialize
	res(await Promise.all(likes.map(async like =>
		await serialize(like.user_id, user))));
});
