import Post, { pack, IPost } from '../../models/post';
import User, { isLocalUser, IUser, isRemoteUser } from '../../models/user';
import stream from '../../publishers/stream';
import Following from '../../models/following';
import { deliver } from '../../queue';
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

export default async (user: IUser, data: {
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
}) => new Promise<IPost>(async (res, rej) => {
	if (data.createdAt == null) data.createdAt = new Date();
	if (data.visibility == null) data.visibility = 'public';

	const tags = data.tags || [];

	let tokens = null;

	if (data.text) {
		// Analyze
		tokens = parse(data.text);

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

	const insert: any = {
		createdAt: data.createdAt,
		mediaIds: data.media ? data.media.map(file => file._id) : [],
		replyId: data.reply ? data.reply._id : null,
		repostId: data.repost ? data.repost._id : null,
		text: data.text,
		textHtml: tokens === null ? null : html(tokens),
		poll: data.poll,
		cw: data.cw,
		tags,
		userId: user._id,
		viaMobile: data.viaMobile,
		geo: data.geo || null,
		appId: data.app ? data.app._id : null,
		visibility: data.visibility,

		// 以下非正規化データ
		_reply: data.reply ? { userId: data.reply.userId } : null,
		_repost: data.repost ? { userId: data.repost.userId } : null,
		_user: {
			host: user.host,
			hostLower: user.hostLower,
			account: isLocalUser(user) ? {} : {
				inbox: user.account.inbox
			}
		}
	};

	if (data.uri != null) insert.uri = data.uri;

	// 投稿を作成
	const post = await Post.insert(insert);

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
	if (post.channelId == null) {
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
				as: 'user'
			}
		}, {
			$match: {
				followeeId: post.userId
			}
		}], {
			_id: false
		});

		// この投稿が3分以内に作成されたものであるならストリームに配信
		const shouldDistribute = new Date().getTime() - post.createdAt.getTime() < 1000 * 60 * 3;

		if (shouldDistribute) {
			const note = await renderNote(user, post);
			const content = renderCreate(note);
			content['@context'] = context;

			// 投稿がリプライかつ投稿者がローカルユーザーかつリプライ先の投稿の投稿者がリモートユーザーなら配送
			if (data.reply && isLocalUser(user) && isRemoteUser(data.reply._user)) {
				deliver(user, content, data.reply._user.account.inbox).save();
			}

			Promise.all(followers.map(follower => {
				follower = follower.user[0];

				if (isLocalUser(follower)) {
					// Publish event to followers stream
					stream(follower._id, 'post', postObj);
				} else {
					// フォロワーがリモートユーザーかつ投稿者がローカルユーザーなら投稿を配信
					if (isLocalUser(user)) {
						deliver(user, content, follower.account.inbox).save();
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
	if (data.reply) {
		// Increment replies count
		Post.update({ _id: data.reply._id }, {
			$inc: {
				repliesCount: 1
			}
		});

		// (自分自身へのリプライでない限りは)通知を作成
		notify(data.reply.userId, user._id, 'reply', {
			postId: post._id
		});

		// Fetch watchers
		PostWatching.find({
			postId: data.reply._id,
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
			watch(user._id, data.reply);
		}

		// Add mention
		addMention(data.reply.userId, 'reply');
	}

	// If it is repost
	if (data.repost) {
		// Notify
		const type = data.text ? 'quote' : 'repost';
		notify(data.repost.userId, user._id, type, {
			post_id: post._id
		});

		// Fetch watchers
		PostWatching.find({
			postId: data.repost._id,
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
			watch(user._id, data.repost);
		}

		// If it is quote repost
		if (data.text) {
			// Add mention
			addMention(data.repost.userId, 'quote');
		} else {
			// Publish event
			if (!user._id.equals(data.repost.userId)) {
				event(data.repost.userId, 'repost', postObj);
			}
		}

		// 今までで同じ投稿をRepostしているか
		const existRepost = await Post.findOne({
			userId: user._id,
			repostId: data.repost._id,
			_id: {
				$ne: post._id
			}
		});

		if (!existRepost) {
			// Update repostee status
			Post.update({ _id: data.repost._id }, {
				$inc: {
					repostCount: 1
				}
			});
		}
	}

	// If has text content
	if (data.text) {
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
			if (data.reply && data.reply.userId.equals(mentionee._id)) return;
			if (data.repost && data.repost.userId.equals(mentionee._id)) return;

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
