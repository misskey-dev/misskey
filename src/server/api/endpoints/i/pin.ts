/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../models/user';
import Post from '../../models/post';
import { pack } from '../../models/user';

/**
 * Pin post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => new Promise(async (res, rej) => {
	// Get 'postId' parameter
	const [postId, postIdErr] = $(params.postId).id().$;
	if (postIdErr) return rej('invalid postId param');

	// Fetch pinee
	const post = await Post.findOne({
		_id: postId,
		userId: user._id
	});

	if (post === null) {
		return rej('post not found');
	}

	await User.update(user._id, {
		$set: {
			pinnedPostId: post._id
		}
	});

	// Serialize
	const iObj = await pack(user, user, {
		detail: true
	});

	// Send response
	res(iObj);
});
