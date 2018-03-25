/**
 * Module dependencies
 */
import $ from 'cafy';
import Reaction from '../../../models/post-reaction';
import Post, { pack as packPost } from '../../../models/post';
import { pack as packUser } from '../../../models/user';
import Watching from '../../../models/post-watching';
import notify from '../../../common/notify';
import watch from '../../../common/watch-post';
import { publishPostStream, pushSw } from '../../../event';

/**
 * React to a post
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = $(params.post_id).id().$;
	if (postIdErr) return rej('invalid post_id param');

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
	if (post.user_id.equals(user._id)) {
		return rej('cannot react to my post');
	}

	// if already reacted
	const exist = await Reaction.findOne({
		post_id: post._id,
		user_id: user._id,
		deleted_at: { $exists: false }
	});

	if (exist !== null) {
		return rej('already reacted');
	}

	// Create reaction
	await Reaction.insert({
		created_at: new Date(),
		post_id: post._id,
		user_id: user._id,
		reaction: reaction
	});

	// Send response
	res();

	const inc = {};
	inc[`reaction_counts.${reaction}`] = 1;

	// Increment reactions count
	await Post.update({ _id: post._id }, {
		$inc: inc
	});

	publishPostStream(post._id, 'reacted');

	// Notify
	notify(post.user_id, user._id, 'reaction', {
		post_id: post._id,
		reaction: reaction
	});

	pushSw(post.user_id, 'reaction', {
		user: await packUser(user, post.user_id),
		post: await packPost(post, post.user_id),
		reaction: reaction
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
				notify(watcher.user_id, user._id, 'reaction', {
					post_id: post._id,
					reaction: reaction
				});
			});
		});

	// この投稿をWatchする
	if (user.account.settings.auto_watch !== false) {
		watch(user._id, post);
	}
});
