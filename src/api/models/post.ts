import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import rap from '@prezzemolo/rap';
import db from '../../db/mongodb';
import { IUser, pack as packUser } from './user';
import { pack as packApp } from './app';
import { pack as packChannel } from './channel';
import Vote from './poll-vote';
import Reaction from './post-reaction';
import { pack as packFile } from './drive-file';
import parse from '../common/text';

const Post = db.get<IPost>('posts');

export default Post;

export function isValidText(text: string): boolean {
	return text.length <= 1000 && text.trim() != '';
}

export type IPost = {
	_id: mongo.ObjectID;
	channel_id: mongo.ObjectID;
	created_at: Date;
	media_ids: mongo.ObjectID[];
	reply_id: mongo.ObjectID;
	repost_id: mongo.ObjectID;
	poll: any; // todo
	text: string;
	user_id: mongo.ObjectID;
	app_id: mongo.ObjectID;
	category: string;
	is_category_verified: boolean;
	via_mobile: boolean;
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

	// Parse text
	if (_post.text) {
		_post.ast = parse(_post.text);
	}

	// Populate user
	_post.user = packUser(_post.user_id, meId);

	// Populate app
	if (_post.app_id) {
		_post.app = packApp(_post.app_id);
	}

	// Populate channel
	if (_post.channel_id) {
		_post.channel = packChannel(_post.channel_id);
	}

	// Populate media
	if (_post.media_ids) {
		_post.media = Promise.all(_post.media_ids.map(fileId =>
			packFile(fileId)
		));
	}

	// When requested a detailed post data
	if (opts.detail) {
		// Get previous post info
		_post.prev = (async () => {
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
			return prev ? prev._id : null;
		})();

		// Get next post info
		_post.next = (async () => {
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
			return next ? next._id : null;
		})();

		if (_post.reply_id) {
			// Populate reply to post
			_post.reply = pack(_post.reply_id, meId, {
				detail: false
			});
		}

		if (_post.repost_id) {
			// Populate repost
			_post.repost = pack(_post.repost_id, meId, {
				detail: _post.text == null
			});
		}

		// Poll
		if (meId && _post.poll) {
			_post.poll = (async (poll) => {
				const vote = await Vote
					.findOne({
						user_id: meId,
						post_id: id
					});

				if (vote != null) {
					const myChoice = poll.choices
						.filter(c => c.id == vote.choice)[0];

					myChoice.is_voted = true;
				}

				return poll;
			})(_post.poll);
		}

		// Fetch my reaction
		if (meId) {
			_post.my_reaction = (async () => {
				const reaction = await Reaction
					.findOne({
						user_id: meId,
						post_id: id,
						deleted_at: { $exists: false }
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
