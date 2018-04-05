import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import rap from '@prezzemolo/rap';
import db from '../db/mongodb';
import { IUser, pack as packUser } from './user';
import { pack as packApp } from './app';
import { pack as packChannel } from './channel';
import Vote from './poll-vote';
import Reaction from './post-reaction';
import { pack as packFile } from './drive-file';

const Post = db.get<IPost>('posts');

Post.createIndex('uri', { sparse: true, unique: true });

export default Post;

export function isValidText(text: string): boolean {
	return text.length <= 1000 && text.trim() != '';
}

export function isValidCw(text: string): boolean {
	return text.length <= 100 && text.trim() != '';
}

export type IPost = {
	_id: mongo.ObjectID;
	channelId: mongo.ObjectID;
	createdAt: Date;
	mediaIds: mongo.ObjectID[];
	replyId: mongo.ObjectID;
	repostId: mongo.ObjectID;
	poll: any; // todo
	text: string;
	tags: string[];
	textHtml: string;
	cw: string;
	userId: mongo.ObjectID;
	appId: mongo.ObjectID;
	viaMobile: boolean;
	repostCount: number;
	repliesCount: number;
	reactionCounts: any;
	mentions: mongo.ObjectID[];
	visibility: 'public' | 'unlisted' | 'private' | 'direct';
	geo: {
		coordinates: number[];
		altitude: number;
		accuracy: number;
		altitudeAccuracy: number;
		heading: number;
		speed: number;
	};
	uri: string;

	_reply?: {
		userId: mongo.ObjectID;
	};
	_repost?: {
		userId: mongo.ObjectID;
	};
	_user: {
		host: string;
		hostLower: string;
		account: {
			inbox?: string;
		};
	};
};

/**
 * Pack a post for API response
 *
 * @param post target
 * @param me? serializee
 * @param options? serialize options
 * @return response
 */
export const pack = async (
	post: string | mongo.ObjectID | IPost,
	me?: string | mongo.ObjectID | IUser,
	options?: {
		detail: boolean
	}
) => {
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

	if (!_post) throw 'invalid post arg.';

	const id = _post._id;

	// Rename _id to id
	_post.id = _post._id;
	delete _post._id;

	delete _post.mentions;
	if (_post.geo) delete _post.geo.type;

	// Populate user
	_post.user = packUser(_post.userId, meId);

	// Populate app
	if (_post.appId) {
		_post.app = packApp(_post.appId);
	}

	// Populate channel
	if (_post.channelId) {
		_post.channel = packChannel(_post.channelId);
	}

	// Populate media
	if (_post.mediaIds) {
		_post.media = Promise.all(_post.mediaIds.map(fileId =>
			packFile(fileId)
		));
	}

	// When requested a detailed post data
	if (opts.detail) {
		// Get previous post info
		_post.prev = (async () => {
			const prev = await Post.findOne({
				userId: _post.userId,
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
			return prev ? prev._id : null;
		})();

		// Get next post info
		_post.next = (async () => {
			const next = await Post.findOne({
				userId: _post.userId,
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
			return next ? next._id : null;
		})();

		if (_post.replyId) {
			// Populate reply to post
			_post.reply = pack(_post.replyId, meId, {
				detail: false
			});
		}

		if (_post.repostId) {
			// Populate repost
			_post.repost = pack(_post.repostId, meId, {
				detail: _post.text == null
			});
		}

		// Poll
		if (meId && _post.poll) {
			_post.poll = (async (poll) => {
				const vote = await Vote
					.findOne({
						userId: meId,
						postId: id
					});

				if (vote != null) {
					const myChoice = poll.choices
						.filter(c => c.id == vote.choice)[0];

					myChoice.isVoted = true;
				}

				return poll;
			})(_post.poll);
		}

		// Fetch my reaction
		if (meId) {
			_post.myReaction = (async () => {
				const reaction = await Reaction
					.findOne({
						userId: meId,
						postId: id,
						deletedAt: { $exists: false }
					});

				if (reaction) {
					return reaction.reaction;
				}

				return null;
			})();
		}
	}

	// resolve promises in _post object
	_post = await rap(_post);

	return _post;
};
