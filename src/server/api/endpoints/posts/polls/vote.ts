/**
 * Module dependencies
 */
import $ from 'cafy';
import Vote from '../../../models/poll-vote';
import Post from '../../../models/post';
import Watching from '../../../models/post-watching';
import notify from '../../../common/notify';
import watch from '../../../common/watch-post';
import { publishPostStream } from '../../../event';

/**
 * Vote poll of a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = $(params.post_id).id().$;
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
		$(params.choice).number()
			.pipe(c => post.poll.choices.some(x => x.id == c))
			.$;
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

	// Increment votes count
	await Post.update({ _id: post._id }, {
		$inc: inc
	});

	publishPostStream(post._id, 'poll_voted');

	// Notify
	notify(post.user_id, user._id, 'poll_vote', {
		post_id: post._id,
		choice: choice
	});

	// Fetch watchers
	Watching
		.find({
			post_id: post._id,
			user_id: { $ne: user._id },
			// 削除されたドキュメントは除く
			deleted_at: { $exists: false }
		}, {
			fields: {
				user_id: true
			}
		})
		.then(watchers => {
			watchers.forEach(watcher => {
				notify(watcher.user_id, user._id, 'poll_vote', {
					post_id: post._id,
					choice: choice
				});
			});
		});

	// この投稿をWatchする
	if (user.account.settings.auto_watch !== false) {
		watch(user._id, post);
	}
});

function findWithAttr(array, attr, value) {
	for (let i = 0; i < array.length; i += 1) {
		if (array[i][attr] === value) {
			return i;
		}
	}
	return -1;
}
