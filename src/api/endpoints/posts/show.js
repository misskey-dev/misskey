'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Post from '../../models/post';
import serialize from '../../serializers/post';

/**
 * Show a post
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

	// Validate id
	if (!mongo.ObjectID.isValid(postId)) {
		return rej('incorrect post_id');
	}

	// Get post
	const post = await Post.findOne({
		_id: new mongo.ObjectID(postId)
	});

	if (post === null) {
		return rej('post not found');
	}

	// Serialize
	res(await serialize(post, user, {
		serializeReplyTo: true,
		includeIsLiked: true
	}));
});
