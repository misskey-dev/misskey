/**
 * Module dependencies
 */
import it from 'cafy';
import Like from '../../../models/like';
import Post from '../../../models/post';
import User from '../../../models/user';
import notify from '../../../common/notify';

/**
 * Like a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = it(params.post_id, 'id', true);
	if (postIdErr) return rej('invalid post_id param');

	// Get likee
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	// Myself
	if (post.user_id.equals(user._id)) {
		return rej('-need-translate-');
	}

	// if already liked
	const exist = await Like.findOne({
		post_id: post._id,
		user_id: user._id,
		deleted_at: { $exists: false }
	});

	if (exist !== null) {
		return rej('already liked');
	}

	// Create like
	await Like.insert({
		created_at: new Date(),
		post_id: post._id,
		user_id: user._id
	});

	// Send response
	res();

	// Increment likes count
	Post.update({ _id: post._id }, {
		$inc: {
			likes_count: 1
		}
	});

	// Increment user likes count
	User.update({ _id: user._id }, {
		$inc: {
			likes_count: 1
		}
	});

	// Increment user liked count
	User.update({ _id: post.user_id }, {
		$inc: {
			liked_count: 1
		}
	});

	// Notify
	notify(post.user_id, user._id, 'like', {
		post_id: post._id
	});
});
