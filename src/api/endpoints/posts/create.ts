/**
 * Module dependencies
 */
import $ from 'cafy';
import deepEqual = require('deep-equal');
import parse from '../../common/text';
import { default as Post, IPost, isValidText } from '../../models/post';
import { default as User, IUser } from '../../models/user';
import { default as Channel, IChannel } from '../../models/channel';
import Following from '../../models/following';
import Mute from '../../models/mute';
import DriveFile from '../../models/drive-file';
import Watching from '../../models/post-watching';
import ChannelWatching from '../../models/channel-watching';
import { pack } from '../../models/post';
import notify from '../../common/notify';
import watch from '../../common/watch-post';
import event, { pushSw, publishChannelStream } from '../../event';
import config from '../../../conf';

/**
 * Create a post
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = (params, user: IUser, app) => new Promise(async (res, rej) => {
	// Get 'text' parameter
	const [text, textErr] = $(params.text).optional.string().pipe(isValidText).$;
	if (textErr) return rej('invalid text');

	// Get 'via_mobile' parameter
	const [viaMobile = false, viaMobileErr] = $(params.via_mobile).optional.boolean().$;
	if (viaMobileErr) return rej('invalid via_mobile');

	// Get 'tags' parameter
	const [tags = [], tagsErr] = $(params.tags).optional.array('string').unique().eachQ(t => t.range(1, 32)).$;
	if (tagsErr) return rej('invalid tags');

	// Get 'geo' parameter
	const [geo, geoErr] = $(params.geo).optional.nullable.strict.object()
		.have('latitude', $().number().range(-90, 90))
		.have('longitude', $().number().range(-180, 180))
		.have('altitude', $().nullable.number())
		.have('accuracy', $().nullable.number())
		.have('altitudeAccuracy', $().nullable.number())
		.have('heading', $().nullable.number().range(0, 360))
		.have('speed', $().nullable.number())
		.$;
	if (geoErr) return rej('invalid geo');

	// Get 'media_ids' parameter
	const [mediaIds, mediaIdsErr] = $(params.media_ids).optional.array('id').unique().range(1, 4).$;
	if (mediaIdsErr) return rej('invalid media_ids');

	let files = [];
	if (mediaIds !== undefined) {
		// Fetch files
		// forEach だと途中でエラーなどがあっても return できないので
		// 敢えて for を使っています。
		for (const mediaId of mediaIds) {
			// Fetch file
			// SELECT _id
			const entity = await DriveFile.findOne({
				_id: mediaId,
				'metadata.user_id': user._id
			});

			if (entity === null) {
				return rej('file not found');
			} else {
				files.push(entity);
			}
		}
	} else {
		files = null;
	}

	// Get 'repost_id' parameter
	const [repostId, repostIdErr] = $(params.repost_id).optional.id().$;
	if (repostIdErr) return rej('invalid repost_id');

	let repost: IPost = null;
	let isQuote = false;
	if (repostId !== undefined) {
		// Fetch repost to post
		repost = await Post.findOne({
			_id: repostId
		});

		if (repost == null) {
			return rej('repostee is not found');
		} else if (repost.repost_id && !repost.text && !repost.media_ids) {
			return rej('cannot repost to repost');
		}

		// Fetch recently post
		const latestPost = await Post.findOne({
			user_id: user._id
		}, {
			sort: {
				_id: -1
			}
		});

		isQuote = text != null || files != null;

		// 直近と同じRepost対象かつ引用じゃなかったらエラー
		if (latestPost &&
			latestPost.repost_id &&
			latestPost.repost_id.equals(repost._id) &&
			!isQuote) {
			return rej('cannot repost same post that already reposted in your latest post');
		}

		// 直近がRepost対象かつ引用じゃなかったらエラー
		if (latestPost &&
			latestPost._id.equals(repost._id) &&
			!isQuote) {
			return rej('cannot repost your latest post');
		}
	}

	// Get 'reply_id' parameter
	const [replyId, replyIdErr] = $(params.reply_id).optional.id().$;
	if (replyIdErr) return rej('invalid reply_id');

	let reply: IPost = null;
	if (replyId !== undefined) {
		// Fetch reply
		reply = await Post.findOne({
			_id: replyId
		});

		if (reply === null) {
			return rej('in reply to post is not found');
		}

		// 返信対象が引用でないRepostだったらエラー
		if (reply.repost_id && !reply.text && !reply.media_ids) {
			return rej('cannot reply to repost');
		}
	}

	// Get 'channel_id' parameter
	const [channelId, channelIdErr] = $(params.channel_id).optional.id().$;
	if (channelIdErr) return rej('invalid channel_id');

	let channel: IChannel = null;
	if (channelId !== undefined) {
		// Fetch channel
		channel = await Channel.findOne({
			_id: channelId
		});

		if (channel === null) {
			return rej('channel not found');
		}

		// 返信対象の投稿がこのチャンネルじゃなかったらダメ
		if (reply && !channelId.equals(reply.channel_id)) {
			return rej('チャンネル内部からチャンネル外部の投稿に返信することはできません');
		}

		// Repost対象の投稿がこのチャンネルじゃなかったらダメ
		if (repost && !channelId.equals(repost.channel_id)) {
			return rej('チャンネル内部からチャンネル外部の投稿をRepostすることはできません');
		}

		// 引用ではないRepostはダメ
		if (repost && !isQuote) {
			return rej('チャンネル内部では引用ではないRepostをすることはできません');
		}
	} else {
		// 返信対象の投稿がチャンネルへの投稿だったらダメ
		if (reply && reply.channel_id != null) {
			return rej('チャンネル外部からチャンネル内部の投稿に返信することはできません');
		}

		// Repost対象の投稿がチャンネルへの投稿だったらダメ
		if (repost && repost.channel_id != null) {
			return rej('チャンネル外部からチャンネル内部の投稿をRepostすることはできません');
		}
	}

	// Get 'poll' parameter
	const [poll, pollErr] = $(params.poll).optional.strict.object()
		.have('choices', $().array('string')
			.unique()
			.range(2, 10)
			.each(c => c.length > 0 && c.length < 50))
		.$;
	if (pollErr) return rej('invalid poll');

	if (poll) {
		(poll as any).choices = (poll as any).choices.map((choice, i) => ({
			id: i, // IDを付与
			text: choice.trim(),
			votes: 0
		}));
	}

	// テキストが無いかつ添付ファイルが無いかつRepostも無いかつ投票も無かったらエラー
	if (text === undefined && files === null && repost === null && poll === undefined) {
		return rej('text, media_ids, repost_id or poll is required');
	}

	// 直近の投稿と重複してたらエラー
	// TODO: 直近の投稿が一日前くらいなら重複とは見なさない
	if (user.latest_post) {
		if (deepEqual({
			text: user.latest_post.text,
			reply: user.latest_post.reply_id ? user.latest_post.reply_id.toString() : null,
			repost: user.latest_post.repost_id ? user.latest_post.repost_id.toString() : null,
			media_ids: (user.latest_post.media_ids || []).map(id => id.toString())
		}, {
			text: text,
			reply: reply ? reply._id.toString() : null,
			repost: repost ? repost._id.toString() : null,
			media_ids: (files || []).map(file => file._id.toString())
		})) {
			return rej('duplicate');
		}
	}

	let tokens = null;
	if (text) {
		// Analyze
		tokens = parse(text);

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

	// 投稿を作成
	const post = await Post.insert({
		created_at: new Date(),
		channel_id: channel ? channel._id : undefined,
		index: channel ? channel.index + 1 : undefined,
		media_ids: files ? files.map(file => file._id) : undefined,
		reply_id: reply ? reply._id : undefined,
		repost_id: repost ? repost._id : undefined,
		poll: poll,
		text: text,
		tags: tags,
		user_id: user._id,
		app_id: app ? app._id : null,
		via_mobile: viaMobile,
		geo,

		// 以下非正規化データ
		_reply: reply ? { user_id: reply.user_id } : undefined,
		_repost: repost ? { user_id: repost.user_id } : undefined,
	});

	// Serialize
	const postObj = await pack(post);

	// Reponse
	res({
		created_post: postObj
	});

	//#region Post processes

	User.update({ _id: user._id }, {
		$set: {
			latest_post: post
		}
	});

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
			const mentioneesMutedUserIds = mentioneeMutes.map(m => m.mutee_id.toString());
			if (mentioneesMutedUserIds.indexOf(user._id.toString()) == -1) {
				event(mentionee, reason, postObj);
				pushSw(mentionee, reason, postObj);
			}
		}
	}

	// タイムラインへの投稿
	if (!channel) {
		// Publish event to myself's stream
		event(user._id, 'post', postObj);

		// Fetch all followers
		const followers = await Following
			.find({
				followee_id: user._id,
				// 削除されたドキュメントは除く
				deleted_at: { $exists: false }
			}, {
				follower_id: true,
				_id: false
			});

		// Publish event to followers stream
		followers.forEach(following =>
			event(following.follower_id, 'post', postObj));
	}

	// チャンネルへの投稿
	if (channel) {
		// Increment channel index(posts count)
		Channel.update({ _id: channel._id }, {
			$inc: {
				index: 1
			}
		});

		// Publish event to channel
		publishChannelStream(channel._id, 'post', postObj);

		// Get channel watchers
		const watches = await ChannelWatching.find({
			channel_id: channel._id,
			// 削除されたドキュメントは除く
			deleted_at: { $exists: false }
		});

		// チャンネルの視聴者(のタイムライン)に配信
		watches.forEach(w => {
			event(w.user_id, 'post', postObj);
		});
	}

	// Increment my posts count
	User.update({ _id: user._id }, {
		$inc: {
			posts_count: 1
		}
	});

	// If has in reply to post
	if (reply) {
		// Increment replies count
		Post.update({ _id: reply._id }, {
			$inc: {
				replies_count: 1
			}
		});

		// 自分自身へのリプライでない限りは通知を作成
		notify(reply.user_id, user._id, 'reply', {
			post_id: post._id
		});

		// Fetch watchers
		Watching
			.find({
				post_id: reply._id,
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
					notify(watcher.user_id, user._id, 'reply', {
						post_id: post._id
					});
				});
			});

		// この投稿をWatchする
		if (user.account.settings.auto_watch !== false) {
			watch(user._id, reply);
		}

		// Add mention
		addMention(reply.user_id, 'reply');
	}

	// If it is repost
	if (repost) {
		// Notify
		const type = text ? 'quote' : 'repost';
		notify(repost.user_id, user._id, type, {
			post_id: post._id
		});

		// Fetch watchers
		Watching
			.find({
				post_id: repost._id,
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
					notify(watcher.user_id, user._id, type, {
						post_id: post._id
					});
				});
			});

		// この投稿をWatchする
		// TODO: ユーザーが「Repostしたときに自動でWatchする」設定を
		//       オフにしていた場合はしない
		watch(user._id, repost);

		// If it is quote repost
		if (text) {
			// Add mention
			addMention(repost.user_id, 'quote');
		} else {
			// Publish event
			if (!user._id.equals(repost.user_id)) {
				event(repost.user_id, 'repost', postObj);
			}
		}

		// 今までで同じ投稿をRepostしているか
		const existRepost = await Post.findOne({
			user_id: user._id,
			repost_id: repost._id,
			_id: {
				$ne: post._id
			}
		});

		if (!existRepost) {
			// Update repostee status
			Post.update({ _id: repost._id }, {
				$inc: {
					repost_count: 1
				}
			});
		}
	}

	// If has text content
	if (text) {
		/*
				// Extract a hashtags
				const hashtags = tokens
					.filter(t => t.type == 'hashtag')
					.map(t => t.hashtag)
					// Drop dupulicates
					.filter((v, i, s) => s.indexOf(v) == i);

				// ハッシュタグをデータベースに登録
				registerHashtags(user, hashtags);
		*/
		// Extract an '@' mentions
		const atMentions = tokens
			.filter(t => t.type == 'mention')
			.map(m => m.username)
			// Drop dupulicates
			.filter((v, i, s) => s.indexOf(v) == i);

		// Resolve all mentions
		await Promise.all(atMentions.map(async (mention) => {
			// Fetch mentioned user
			// SELECT _id
			const mentionee = await User
				.findOne({
					username_lower: mention.toLowerCase()
				}, { _id: true });

			// When mentioned user not found
			if (mentionee == null) return;

			// 既に言及されたユーザーに対する返信や引用repostの場合も無視
			if (reply && reply.user_id.equals(mentionee._id)) return;
			if (repost && repost.user_id.equals(mentionee._id)) return;

			// Add mention
			addMention(mentionee._id, 'mention');

			// Create notification
			notify(mentionee._id, user._id, 'mention', {
				post_id: post._id
			});

			return;
		}));
	}

	// Register to search database
	if (text && config.elasticsearch.enable) {
		const es = require('../../../db/elasticsearch');

		es.index({
			index: 'misskey',
			type: 'post',
			id: post._id.toString(),
			body: {
				text: post.text
			}
		});
	}

	// Append mentions data
	if (mentions.length > 0) {
		Post.update({ _id: post._id }, {
			$set: {
				mentions: mentions
			}
		});
	}

	//#endregion
});
