/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import Post from '../models/post';
import Like from '../models/like';
import Vote from '../models/poll-vote';
import serializeApp from './app';
import serializeUser from './user';
import serializeDriveFile from './drive-file';
import parse from '../common/text';

/**
 * Serialize a post
 *
 * @param {any} post
 * @param {any} me?
 * @param {any} options?
 * @return {Promise<any>}
 */
const self = (
	post: any,
	me?: any,
	options?: {
		detail: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = options || {
		detail: true,
	};

	let _post: any;

	// Populate the post if 'post' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(post)) {
		_post = await Post.findOne({
			_id: post
		});
	} else if (typeof post === 'string') {
		_post = await Post.findOne({
			_id: new mongo.ObjectID(post)
		});
	} else {
		_post = deepcopy(post);
	}

	const id = _post._id;

	// Rename _id to id
	_post.id = _post._id;
	delete _post._id;

	delete _post.mentions;

	// Parse text
	if (_post.text) {
		_post.ast = parse(_post.text);
	}

	// Populate user
	_post.user = await serializeUser(_post.user_id, me);

	// Populate app
	if (_post.app_id) {
		_post.app = await serializeApp(_post.app_id);
	}

	if (_post.media_ids) {
		// Populate media
		_post.media = await Promise.all(_post.media_ids.map(async fileId =>
			await serializeDriveFile(fileId)
		));
	}

	if (_post.reply_to_id && opts.detail) {
		// Populate reply to post
		_post.reply_to = await self(_post.reply_to_id, me, {
			detail: false
		});
	}

	if (_post.repost_id && opts.detail) {
		// Populate repost
		_post.repost = await self(_post.repost_id, me, {
			detail: _post.text == null
		});
	}

	// Poll
	if (me && _post.poll && opts.detail) {
		const vote = await Vote
			.findOne({
				user_id: me._id,
				post_id: id
			});

		if (vote != null) {
			_post.poll.choices.filter(c => c.id == vote.choice)[0].is_voted = true;
		}
	}

	// Check if it is liked
	if (me && opts.detail) {
		const liked = await Like
			.count({
				user_id: me._id,
				post_id: id,
				deleted_at: { $exists: false }
			}, {
				limit: 1
			});

		_post.is_liked = liked === 1;
	}

	resolve(_post);
});

export default self;
