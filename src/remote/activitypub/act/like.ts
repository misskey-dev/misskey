import { MongoError } from 'mongodb';
import Post from '../../../models/post';
import Reaction from '../../../models/post-reaction';
import config from '../../../config';
import queue from '../../../queue';

export default async (actor, activity) => {
	const prefix = config.url + '/posts';
	const id = activity.object.id || activity.object;
	let reaction;

	if (!id.startsWith(prefix)) {
		return null;
	}

	const postId = id.slice(prefix.length);

	const post = await Post.findOne({ _id: postId });
	if (post === null) {
		throw new Error();
	}

	try {
		reaction = await Reaction.insert({
			createdAt: new Date(),
			postId,
			userId: actor._id,
			reaction: 'pudding'
		});
	} catch (exception) {
		// duplicate key error
		if (exception instanceof MongoError && exception.code === 11000) {
			return null;
		}

		throw exception;
	}

	await new Promise((resolve, reject) => {
		queue.create('http', { type: 'like', reaction: reaction._id }).save(error => {
			if (error) {
				reject(error);
			} else {
				resolve(null);
			}
		});
	});
};
