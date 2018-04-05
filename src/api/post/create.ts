import Post, { pack, IPost } from '../../models/post';
import User, { isLocalUser, IUser } from '../../models/user';
import stream from '../../publishers/stream';
import Following from '../../models/following';
import { createHttp } from '../../queue';
import renderNote from '../../remote/activitypub/renderer/note';
import renderCreate from '../../remote/activitypub/renderer/create';
import context from '../../remote/activitypub/renderer/context';
import { IDriveFile } from '../../models/drive-file';
import notify from '../../publishers/notify';
import PostWatching from '../../models/post-watching';
import watch from './watch';
import Mute from '../../models/mute';
import pushSw from '../../publishers/push-sw';
import event from '../../publishers/stream';
import parse from '../../text/parse';
import html from '../../text/html';
import { IApp } from '../../models/app';

export default async (user: IUser, content: {
	createdAt?: Date;
	text?: string;
	reply?: IPost;
	repost?: IPost;
	media?: IDriveFile[];
	geo?: any;
	poll?: any;
	viaMobile?: boolean;
	tags?: string[];
	cw?: string;
	visibility?: string;
	uri?: string;
	app?: IApp;
}, silent = false) => new Promise<IPost>(async (res, rej) => {
	if (content.createdAt == null) content.createdAt = new Date();
	if (content.visibility == null) content.visibility = 'public';

	const tags = content.tags || [];

	let tokens = null;

	if (content.text) {
		// Analyze
		tokens = parse(content.text);

		// Extract hashtags
		const hashtags = tokens
			.filter(t => t.type == 'hashtag')
			.map(t => t.hashtag);

		hashtags.forEach(tag => {
			if (tags.indexOf(tag) == -1) {
				tags.push(tag);
			}
		});
	}

	const data: any = {
		createdAt: content.createdAt,
		mediaIds: content.media ? content.media.map(file => file._id) : [],
		replyId: content.reply ? content.reply._id : null,
		repostId: content.repost ? content.repost._id : null,
		text: content.text,
		textHtml: tokens === null ? null : html(tokens),
		poll: content.poll,
		cw: content.cw,
		tags,
		userId: user._id,
		viaMobile: content.viaMobile,
		geo: content.geo || null,
		appId: content.app ? content.app._id : null,
		visibility: content.visibility,

		// 以下非正規化データ
		_reply: content.reply ? { userId: content.reply.userId } : null,
		_repost: content.repost ? { userId: content.repost.userId } : null,
	};

	if (content.uri != null) data.uri = content.uri;

	// 投稿を作成
	const post = await Post.insert(data);

	res(post);

	User.update({ _id: user._id }, {
		// Increment posts count
		$inc: {
			postsCount: 1
		},
		// Update latest post
		$set: {
			latestPost: post
		}
	});

	// Serialize
	const postObj = await pack(post);

	// タイムラインへの投稿
	if (!post.channelId) {
		// Publish event to myself's stream
		if (isLocalUser(user)) {
			stream(post.userId, 'post', postObj);
		}

		// Fetch all followers
		const followers = await Following.aggregate([{
			$lookup: {
				from: 'users',
				localField: 'followerId',
				foreignField: '_id',
				as: 'follower'
			}
		}, {
			$match: {
				followeeId: post.userId
			}
		}], {
			_id: false
		});

		if (!silent) {
			const note = await renderNote(user, post);
			const content = renderCreate(note);
			content['@context'] = context;

			Promise.all(followers.map(({ follower }) => {
				if (isLocalUser(follower)) {
					// Publish event to followers stream
					stream(follower._id, 'post', postObj);
				} else {
					// フォロワーがリモートユーザーかつ投稿者がローカルユーザーなら投稿を配信
					if (isLocalUser(user)) {
						createHttp({
							type: 'deliver',
							user,
							content,
							to: follower.account.inbox
						}).save();
					}
				}
			}));
		}
	}

	// チャンネルへの投稿
	/* TODO
	if (post.channelId) {
		promises.push(
			// Increment channel index(posts count)
			Channel.update({ _id: post.channelId }, {
				$inc: {
					index: 1
				}
			}),

			// Publish event to channel
			promisedPostObj.then(postObj => {
				publishChannelStream(post.channelId, 'post', postObj);
			}),

			Promise.all([
				promisedPostObj,

				// Get channel watchers
				ChannelWatching.find({
					channelId: post.channelId,
					// 削除されたドキュメントは除く
					deletedAt: { $exists: false }
				})
			]).then(([postObj, watches]) => {
				// チャンネルの視聴者(のタイムライン)に配信
				watches.forEach(w => {
					stream(w.userId, 'post', postObj);
				});
			})
		);
	}*/

	const mentions = [];

	async function addMention(mentionee, reason) {
		// Reject if already added
		if (mentions.some(x => x.equals(mentionee))) return;

		// Add mention
		mentions.push(mentionee);

		// Publish event
		if (!user._id.equals(mentionee)) {
			const mentioneeMutes = await Mute.find({
				muter_id: mentionee,
				deleted_at: { $exists: false }
			});
			const mentioneesMutedUserIds = mentioneeMutes.map(m => m.muteeId.toString());
			if (mentioneesMutedUserIds.indexOf(user._id.toString()) == -1) {
				event(mentionee, reason, postObj);
				pushSw(mentionee, reason, postObj);
			}
		}
	}

	// If has in reply to post
	if (content.reply) {
		// Increment replies count
		Post.update({ _id: content.reply._id }, {
			$inc: {
				repliesCount: 1
			}
		});

		// (自分自身へのリプライでない限りは)通知を作成
		notify(content.reply.userId, user._id, 'reply', {
			postId: post._id
		});

		// Fetch watchers
		PostWatching.find({
			postId: content.reply._id,
			userId: { $ne: user._id },
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}, {
			fields: {
				userId: true
			}
		}).then(watchers => {
			watchers.forEach(watcher => {
				notify(watcher.userId, user._id, 'reply', {
					postId: post._id
				});
			});
		});

		// この投稿をWatchする
		if (isLocalUser(user) && user.account.settings.autoWatch !== false) {
			watch(user._id, content.reply);
		}

		// Add mention
		addMention(content.reply.userId, 'reply');
	}

	// If it is repost
	if (content.repost) {
		// Notify
		const type = content.text ? 'quote' : 'repost';
		notify(content.repost.userId, user._id, type, {
			post_id: post._id
		});

		// Fetch watchers
		PostWatching.find({
			postId: content.repost._id,
			userId: { $ne: user._id },
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}, {
			fields: {
				userId: true
			}
		}).then(watchers => {
			watchers.forEach(watcher => {
				notify(watcher.userId, user._id, type, {
					postId: post._id
				});
			});
		});

		// この投稿をWatchする
		if (isLocalUser(user) && user.account.settings.autoWatch !== false) {
			watch(user._id, content.repost);
		}

		// If it is quote repost
		if (content.text) {
			// Add mention
			addMention(content.repost.userId, 'quote');
		} else {
			// Publish event
			if (!user._id.equals(content.repost.userId)) {
				event(content.repost.userId, 'repost', postObj);
			}
		}

		// 今までで同じ投稿をRepostしているか
		const existRepost = await Post.findOne({
			userId: user._id,
			repostId: content.repost._id,
			_id: {
				$ne: post._id
			}
		});

		if (!existRepost) {
			// Update repostee status
			Post.update({ _id: content.repost._id }, {
				$inc: {
					repostCount: 1
				}
			});
		}
	}

	// If has text content
	if (content.text) {
		// Extract an '@' mentions
		const atMentions = tokens
			.filter(t => t.type == 'mention')
			.map(m => m.username)
			// Drop dupulicates
			.filter((v, i, s) => s.indexOf(v) == i);

		// Resolve all mentions
		await Promise.all(atMentions.map(async mention => {
			// Fetch mentioned user
			// SELECT _id
			const mentionee = await User
				.findOne({
					usernameLower: mention.toLowerCase()
				}, { _id: true });

			// When mentioned user not found
			if (mentionee == null) return;

			// 既に言及されたユーザーに対する返信や引用repostの場合も無視
			if (content.reply && content.reply.userId.equals(mentionee._id)) return;
			if (content.repost && content.repost.userId.equals(mentionee._id)) return;

			// Add mention
			addMention(mentionee._id, 'mention');

			// Create notification
			notify(mentionee._id, user._id, 'mention', {
				post_id: post._id
			});
		}));
	}

	// Append mentions data
	if (mentions.length > 0) {
		Post.update({ _id: post._id }, {
			$set: {
				mentions
			}
		});
	}
});
