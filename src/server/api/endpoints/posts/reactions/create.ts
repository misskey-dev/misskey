/**
 * Module dependencies
 */
import $ from 'cafy';
import Reaction from '../../../../../models/post-reaction';
import Post, { pack as packPost } from '../../../../../models/post';
import { pack as packUser } from '../../../../../models/user';
import Watching from '../../../../../models/post-watching';
import watch from '../../../common/watch-post';
import { publishPostStream } from '../../../../../publishers/stream';
import notify from '../../../../../publishers/notify';
import pushSw from '../../../../../publishers/push-sw';

/**
 * React to a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'postId' parameter
	const [postId, postIdErr] = $(params.postId).id().$;
	if (postIdErr) return rej('invalid postId param');

	// Get 'reaction' parameter
	const [reaction, reactionErr] = $(params.reaction).string().or([
		'like',
		'love',
		'laugh',
		'hmm',
		'surprise',
		'congrats',
		'angry',
		'confused',
		'pudding'
	]).$;
	if (reactionErr) return rej('invalid reaction param');

	// Fetch reactee
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	// Myself
	if (post.userId.equals(user._id)) {
		return rej('cannot react to my post');
	}

	// if already reacted
	const exist = await Reaction.findOne({
		postId: post._id,
		userId: user._id,
		deletedAt: { $exists: false }
	});

	if (exist !== null) {
		return rej('already reacted');
	}

	// Create reaction
	await Reaction.insert({
		createdAt: new Date(),
		postId: post._id,
		userId: user._id,
		reaction: reaction
	});

	// Send response
	res();

	const inc = {};
	inc[`reactionCounts.${reaction}`] = 1;

	// Increment reactions count
	await Post.update({ _id: post._id }, {
		$inc: inc
	});

	publishPostStream(post._id, 'reacted');

	// Notify
	notify(post.userId, user._id, 'reaction', {
		postId: post._id,
		reaction: reaction
	});

	pushSw(post.userId, 'reaction', {
		user: await packUser(user, post.userId),
		post: await packPost(post, post.userId),
		reaction: reaction
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
				notify(watcher.userId, user._id, 'reaction', {
					postId: post._id,
					reaction: reaction
				});
			});
		});

	// この投稿をWatchする
	if (user.account.settings.autoWatch !== false) {
		watch(user._id, post);
	}
});
