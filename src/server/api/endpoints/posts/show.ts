/**
 * Module dependencies
 */
import $ from 'cafy';
import Post, { pack } from '../../../../models/post';

/**
 * Show a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'postId' parameter
	const [postId, postIdErr] = $(params.postId).id().$;
	if (postIdErr) return rej('invalid postId param');

	// Get post
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	// Serialize
	res(await pack(post, user, {
		detail: true
	}));
});
