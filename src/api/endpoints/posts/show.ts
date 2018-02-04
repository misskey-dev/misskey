/**
 * Module dependencies
 */
import $ from 'cafy';
import Post, { pack } from '../../models/post';

/**
 * Show a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = $(params.post_id).id().$;
	if (postIdErr) return rej('invalid post_id param');

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
