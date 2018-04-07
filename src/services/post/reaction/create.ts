import { IUser, pack as packUser, isLocalUser, isRemoteUser } from '../../../models/user';
import Post, { IPost, pack as packPost } from '../../../models/post';
import PostReaction from '../../../models/post-reaction';
import { publishPostStream } from '../../../publishers/stream';
import notify from '../../../publishers/notify';
import pushSw from '../../../publishers/push-sw';
import PostWatching from '../../../models/post-watching';
import watch from '../watch';
import renderLike from '../../../remote/activitypub/renderer/like';
import { deliver } from '../../../queue';
import context from '../../../remote/activitypub/renderer/context';

export default async (user: IUser, post: IPost, reaction: string) => new Promise(async (res, rej) => {
	// Myself
	if (post.userId.equals(user._id)) {
		return rej('cannot react to my post');
	}

	// if already reacted
	const exist = await PostReaction.findOne({
		postId: post._id,
		userId: user._id
	});

	if (exist !== null) {
		return rej('already reacted');
	}

	// Create reaction
	await PostReaction.insert({
		createdAt: new Date(),
		postId: post._id,
		userId: user._id,
		reaction
	});

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
	PostWatching
		.find({
			postId: post._id,
			userId: { $ne: user._id }
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

	// ユーザーがローカルユーザーかつ自動ウォッチ設定がオンならばこの投稿をWatchする
	if (isLocalUser(user) && user.account.settings.autoWatch !== false) {
		watch(user._id, post);
	}

	//#region 配信
	const content = renderLike(user, post);
	content['@context'] = context;

	// リアクターがローカルユーザーかつリアクション対象がリモートユーザーの投稿なら配送
	if (isLocalUser(user) && isRemoteUser(post._user)) {
		deliver(user, content, post._user.account.inbox).save();
	}
	//#endregion
});
