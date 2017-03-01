'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import validate from '../../validator';
import parse from '../../../common/text';
import { Post, isValidText } from '../../models/post';
import User from '../../models/user';
import Following from '../../models/following';
import DriveFile from '../../models/drive-file';
import serialize from '../../serializers/post';
import createFile from '../../common/add-file-to-drive';
import notify from '../../common/notify';
import event from '../../event';
import config from '../../../conf';

/**
 * 添付できるファイルの数
 */
const maxMediaCount = 4;

function hasDuplicates(array) {
	return (new Set(array)).size !== array.length;
}

/**
 * Create a post
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = (params, user, app) =>
	new Promise(async (res, rej) =>
{
	// Get 'text' parameter
	const [text, textErr] = validate(params.text, 'string', false, isValidText);
	if (textErr) return rej('invalid text');

	// Get 'media_ids' parameter
	const [mediaIds, mediaIdsErr] = validate(params.media_ids, 'array', false, x => !hasDuplicates(x));
	if (mediaIdsErr) return rej('invalid media_ids');

	let files = [];
	if (mediaIds !== null) {
		if (mediaIds.length > maxMediaCount) {
			return rej('too many media');
		}

		// Drop duplications
		medias = medias.filter((x, i, s) => s.indexOf(x) == i);

		// Fetch files
		// forEach だと途中でエラーなどがあっても return できないので
		// 敢えて for を使っています。
		for (let i = 0; i < medias.length; i++) {
			const media = medias[i];

			if (typeof media != 'string') {
				return rej('media id must be a string');
			}

			// Validate id
			if (!mongo.ObjectID.isValid(media)) {
				return rej('incorrect media id');
			}

			// Fetch file
			// SELECT _id
			const entity = await DriveFile.findOne({
				_id: new mongo.ObjectID(media),
				user_id: user._id
			}, {
				_id: true
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
	let repost = params.repost_id;
	if (repost !== undefined && repost !== null) {
		if (typeof repost != 'string') {
			return rej('repost_id must be a string');
		}

		// Validate id
		if (!mongo.ObjectID.isValid(repost)) {
			return rej('incorrect repost_id');
		}

		// Fetch repost to post
		repost = await Post.findOne({
			_id: new mongo.ObjectID(repost)
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

		// 直近と同じRepost対象かつ引用じゃなかったらエラー
		if (latestPost &&
				latestPost.repost_id &&
				latestPost.repost_id.equals(repost._id) &&
				text === null && files === null) {
			return rej('二重Repostです(NEED TRANSLATE)');
		}

		// 直近がRepost対象かつ引用じゃなかったらエラー
		if (latestPost &&
				latestPost._id.equals(repost._id) &&
				text === null && files === null) {
			return rej('二重Repostです(NEED TRANSLATE)');
		}
	} else {
		repost = null;
	}

	// Get 'reply_to_id' parameter
	let replyTo = params.reply_to_id;
	if (replyTo !== undefined && replyTo !== null) {
		if (typeof replyTo != 'string') {
			return rej('reply_to_id must be a string');
		}

		// Validate id
		if (!mongo.ObjectID.isValid(replyTo)) {
			return rej('incorrect reply_to_id');
		}

		// Fetch reply
		replyTo = await Post.findOne({
			_id: new mongo.ObjectID(replyTo)
		});

		if (replyTo === null) {
			return rej('reply to post is not found');
		}

		// 返信対象が引用でないRepostだったらエラー
		if (replyTo.repost_id && !replyTo.text && !replyTo.media_ids) {
			return rej('cannot reply to repost');
		}
	} else {
		replyTo = null;
	}

	// Get 'poll' parameter
	let poll = params.poll;
	if (poll !== undefined && poll !== null) {
		// 選択肢が無かったらエラー
		if (poll.choices == null) {
			return rej('poll choices is required');
		}

		// 選択肢が配列でなかったらエラー
		if (!Array.isArray(poll.choices)) {
			return rej('poll choices must be an array');
		}

		// 選択肢が空の配列でエラー
		if (poll.choices.length == 0) {
			return rej('poll choices is required');
		}

		// Validate each choices
		const shouldReject = poll.choices.some(choice => {
			if (typeof choice !== 'string') return true;
			if (choice.trim().length === 0) return true;
			if (choice.trim().length > 100) return true;
		});

		if (shouldReject) {
			return rej('invalid poll choices');
		}

		// Trim choices
		poll.choices = poll.choices.map(choice => choice.trim());

		// Drop duplications
		poll.choices = poll.choices.filter((x, i, s) => s.indexOf(x) == i);

		// 選択肢がひとつならエラー
		if (poll.choices.length == 1) {
			return rej('poll choices must be ひとつ以上');
		}

		// 選択肢が多すぎてもエラー
		if (poll.choices.length > 10) {
			return rej('many poll choices');
		}

		// serialize
		poll.choices = poll.choices.map((choice, i) => ({
			id: i, // IDを付与
			text: choice,
			votes: 0
		}));
	} else {
		poll = null;
	}

	// テキストが無いかつ添付ファイルが無いかつRepostも無いかつ投票も無かったらエラー
	if (text === null && files === null && repost === null && poll === null) {
		return rej('text, media_ids, repost_id or poll is required');
	}

	// 投稿を作成
	const post = await Post.insert({
		created_at: new Date(),
		media_ids: files ? files.map(file => file._id) : undefined,
		reply_to_id: replyTo ? replyTo._id : undefined,
		repost_id: repost ? repost._id : undefined,
		poll: poll ? poll : undefined,
		text: text,
		user_id: user._id,
		app_id: app ? app._id : null
	});

	// Serialize
	const postObj = await serialize(post);

	// Reponse
	res(postObj);

	//--------------------------------
	// Post processes

	let mentions = [];

	function addMention(mentionee, type) {
		// Reject if already added
		if (mentions.some(x => x.equals(mentionee))) return;

		// Add mention
		mentions.push(mentionee);

		// Publish event
		if (!user._id.equals(mentionee)) {
			event(mentionee, type, postObj);
		}
	}

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

	// Increment my posts count
	User.update({ _id: user._id }, {
		$inc: {
			posts_count: 1
		}
	});

	// If has in reply to post
	if (replyTo) {
		// Increment replies count
		Post.update({ _id: replyTo._id }, {
			$inc: {
				replies_count: 1
			}
		});

		// 自分自身へのリプライでない限りは通知を作成
		notify(replyTo.user_id, user._id, 'reply', {
			post_id: post._id
		});

		// Add mention
		addMention(replyTo.user_id, 'reply');
	}

	// If it is repost
	if (repost) {
		// Notify
		const type = text ? 'quote' : 'repost';
		notify(repost.user_id, user._id, type, {
			post_id: post._id
		});

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
		// Analyze
		const tokens = parse(text);

		// Extract a hashtags
		const hashtags = tokens
			.filter(t => t.type == 'hashtag')
			.map(t => t.hashtag)
			// Drop dupulicates
			.filter((v, i, s) => s.indexOf(v) == i);

		// ハッシュタグをデータベースに登録
		//registerHashtags(user, hashtags);

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
			if (replyTo && replyTo.user_id.equals(mentionee._id)) return;
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
});
