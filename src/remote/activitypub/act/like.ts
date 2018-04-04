import { MongoError } from 'mongodb';
import Reaction, { IPostReaction } from '../../../models/post-reaction';
import Post from '../../../models/post';
import queue from '../../../queue';

export default async (resolver, actor, activity, distribute) => {
	const id = activity.object.id || activity.object;

	// Transform:
	// https://misskey.ex/@syuilo/xxxx to
	// xxxx
	const postId = id.split('/').pop();

	const post = await Post.findOne({ _id: postId });
	if (post === null) {
		throw new Error();
	}

	if (!distribute) {
		const { _id } = await Reaction.findOne({
			userId: actor._id,
			postId: post._id
		});

		return {
			resolver,
			object: { $ref: 'postPeactions', $id: _id }
		};
	}

	const promisedReaction = Reaction.insert({
		createdAt: new Date(),
		userId: actor._id,
		postId: post._id,
		reaction: 'pudding'
	}).then(reaction => new Promise<IPostReaction>((resolve, reject) => {
		queue.create('http', {
			type: 'reaction',
			reactionId: reaction._id
		}).save(error => {
			if (error) {
				reject(error);
			} else {
				resolve(reaction);
			}
		});
	}), async error => {
		// duplicate key error
		if (error instanceof MongoError && error.code === 11000) {
			return Reaction.findOne({
				userId: actor._id,
				postId: post._id
			});
		}

		throw error;
	});

	return promisedReaction.then(({ _id }) => ({
		resolver,
		object: { $ref: 'postPeactions', $id: _id }
	}));
};
