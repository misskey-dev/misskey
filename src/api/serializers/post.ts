/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import { default as Post, IPost } from '../models/post';
import Reaction from '../models/post-reaction';
import { IUser } from '../models/user';
import Vote from '../models/poll-vote';
import serializeApp from './app';
import serializeChannel from './channel';
import serializeUser from './user';
import serializeDriveFile from './drive-file';
import parse from '../common/text';

/**
 * Serialize a post
 *
 * @param post target
 * @param me? serializee
 * @param options? serialize options
 * @return response
 */
const self = (
	post: string | mongo.ObjectID | IPost,
	me?: string | mongo.ObjectID | IUser,
	options?: {
		detail: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = options || {
		detail: true,
	};

	// Me
	const meId: mongo.ObjectID = me
		? mongo.ObjectID.prototype.isPrototypeOf(me)
			? me as mongo.ObjectID
			: typeof me === 'string'
				? new mongo.ObjectID(me)
				: (me as IUser)._id
		: null;

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
	_post.user = await serializeUser(_post.user_id, meId);

	// Populate app
	if (_post.app_id) {
		_post.app = await serializeApp(_post.app_id);
	}

	// Populate channel
	if (_post.channel_id) {
		_post.channel = await serializeChannel(_post.channel_id);
	}

	// Populate media
	if (_post.media_ids) {
		_post.media = await Promise.all(_post.media_ids.map(async fileId =>
			await serializeDriveFile(fileId)
		));
	}

	// When requested a detailed post data
	if (opts.detail) {
		// Get previous post info
		const prev = await Post.findOne({
			user_id: _post.user_id,
			_id: {
				$lt: id
			}
		}, {
			fields: {
				_id: true
			},
			sort: {
				_id: -1
			}
		});
		_post.prev = prev ? prev._id : null;

		// Get next post info
		const next = await Post.findOne({
			user_id: _post.user_id,
			_id: {
				$gt: id
			}
		}, {
			fields: {
				_id: true
			},
			sort: {
				_id: 1
			}
		});
		_post.next = next ? next._id : null;

		if (_post.reply_to_id) {
			// Populate reply to post
			_post.reply_to = await self(_post.reply_to_id, meId, {
				detail: false
			});
		}

		if (_post.repost_id) {
			// Populate repost
			_post.repost = await self(_post.repost_id, meId, {
				detail: _post.text == null
			});
		}

		// Poll
		if (meId && _post.poll) {
			const vote = await Vote
				.findOne({
					user_id: meId,
					post_id: id
				});

			if (vote != null) {
				const myChoice = _post.poll.choices
					.filter(c => c.id == vote.choice)[0];

				myChoice.is_voted = true;
			}
		}

		// Fetch my reaction
		if (meId) {
			const reaction = await Reaction
				.findOne({
					user_id: meId,
					post_id: id,
					deleted_at: { $exists: false }
				});

			if (reaction) {
				_post.my_reaction = reaction.reaction;
			}
		}
	}

	resolve(_post);
});

export default self;
