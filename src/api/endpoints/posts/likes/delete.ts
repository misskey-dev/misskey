'use strict';

/**
 * Module dependencies
 */
import it from '../../../it';
import Like from '../../../models/like';
import Post from '../../../models/post';
import User from '../../../models/user';
// import event from '../../../event';

/**
 * Unlike a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) => {
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

		// if already liked
		const exist = await Like.findOne({
			post_id: post._id,
			user_id: user._id,
			deleted_at: { $exists: false }
		});

		if (exist === null) {
			return rej('already not liked');
		}

		// Delete like
		await Like.update({
			_id: exist._id
		}, {
				$set: {
					deleted_at: new Date()
				}
			});

		// Send response
		res();

		// Decrement likes count
		Post.update({ _id: post._id }, {
			$inc: {
				likes_count: -1
			}
		});

		// Decrement user likes count
		User.update({ _id: user._id }, {
			$inc: {
				likes_count: -1
			}
		});

		// Decrement user liked count
		User.update({ _id: post.user_id }, {
			$inc: {
				liked_count: -1
			}
		});
	});
