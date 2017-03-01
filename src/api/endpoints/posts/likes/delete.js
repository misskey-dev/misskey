'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
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
		let postId = params.post_id;
		if (postId === undefined || postId === null) {
			return rej('post_id is required');
		}

		// Validate id
		if (!mongo.ObjectID.isValid(postId)) {
			return rej('incorrect post_id');
		}

		// Get likee
		const post = await Post.findOne({
			_id: new mongo.ObjectID(postId)
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
