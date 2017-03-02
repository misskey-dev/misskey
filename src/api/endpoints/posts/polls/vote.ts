'use strict';

/**
 * Module dependencies
 */
import it from '../../../it';
import Vote from '../../../models/poll-vote';
import Post from '../../../models/post';
import notify from '../../../common/notify';

/**
 * Vote poll of a post
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

		// Get votee
		const post = await Post.findOne({
			_id: postId
		});

		if (post === null) {
			return rej('post not found');
		}

		if (post.poll == null) {
			return rej('poll not found');
		}

		// Get 'choice' parameter
		const [choice, choiceError] =
			it(params.choice).expect.string()
				.required()
				.validate(c => post.poll.choices.some(x => x.id == c))
				.qed();
		if (choiceError) return rej('invalid choice param');

		// if already voted
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
