/**
 * Module dependencies
 */
import $ from 'cafy';
import Vote from '../../../../../models/poll-vote';
import Post from '../../../../../models/post';
import Watching from '../../../../../models/post-watching';
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
	// Get 'postId' parameter
	const [postId, postIdErr] = $(params.postId).id().$;
	if (postIdErr) return rej('invalid postId param');

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
		postId: post._id,
		userId: user._id
	});

	if (exist !== null) {
		return rej('already voted');
	}

	// Create vote
	await Vote.insert({
		createdAt: new Date(),
		postId: post._id,
		userId: user._id,
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
	notify(post.userId, user._id, 'poll_vote', {
		postId: post._id,
		choice: choice
	});

	// Fetch watchers
	Watching
		.find({
			postId: post._id,
			userId: { $ne: user._id },
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}, {
			fields: {
				userId: true
			}
		})
		.then(watchers => {
			watchers.forEach(watcher => {
				notify(watcher.userId, user._id, 'poll_vote', {
					postId: post._id,
					choice: choice
				});
			});
		});

	// この投稿をWatchする
	if (user.account.settings.autoWatch !== false) {
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
