'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Vote from '../../../models/poll-vote';
import Post from '../../../models/post';
import notify from '../../../common/notify';

/**
 * Vote poll of a post
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) => {
		// Get 'post_id' parameter
		const postId = params.post_id;
		if (postId === undefined || postId === null) {
			return rej('post_id is required');
		}

		// Validate id
		if (!mongo.ObjectID.isValid(postId)) {
			return rej('incorrect post_id');
		}

		// Get votee
		const post = await Post.findOne({
			_id: new mongo.ObjectID(postId)
		});

		if (post === null) {
			return rej('post not found');
		}

		if (post.poll == null) {
			return rej('poll not found');
		}

		// Get 'choice' parameter
		const choice = params.choice;
		if (choice == null) {
			return rej('choice is required');
		}

		// Validate choice
		if (!post.poll.choices.some(x => x.id == choice)) {
			return rej('invalid choice');
		}

		// already voted
		const exist = await Vote.findOne({
			post_id: post._id,
			user_id: user._id
		});

		if (exist !== null) {
			return rej('already voted');
		}

		// Create vote
		await Vote.insert({
			created_at: new Date(),
			post_id: post._id,
			user_id: user._id,
			choice: choice
		});

		// Send response
		res();

		const inc = {};
		inc[`poll.choices.${findWithAttr(post.poll.choices, 'id', choice)}.votes`] = 1;

		console.log(inc);

		// Increment likes count
		Post.update({ _id: post._id }, {
			$inc: inc
		});

		// Notify
		notify(post.user_id, user._id, 'poll_vote', {
			post_id: post._id,
			choice: choice
		});
	});

function findWithAttr(array, attr, value) {
	for (let i = 0; i < array.length; i += 1) {
		if (array[i][attr] === value) {
			return i;
		}
	}
	return -1;
}
