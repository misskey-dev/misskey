/**
 * Module dependencies
 */
import $ from 'cafy';
import Favorite from '../../../models/favorite';
import Post from '../../../models/post';

/**
 * Unfavorite a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = $(params.post_id).id().$;
	if (postIdErr) return rej('invalid post_id param');

	// Get favoritee
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	// if already favorited
	const exist = await Favorite.findOne({
		post_id: post._id,
		user_id: user._id
	});

	if (exist === null) {
		return rej('already not favorited');
	}

	// Delete favorite
	await Favorite.deleteOne({
		_id: exist._id
	});

	// Send response
	res();
});
