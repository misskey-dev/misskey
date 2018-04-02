import { MongoError } from 'mongodb';
import parseAcct from '../../../acct/parse';
import Following from '../../../models/following';
import User from '../../../models/user';
import config from '../../../config';
import queue from '../../../queue';

export default async (actor, activity) => {
	const prefix = config.url + '/@';
	const id = activity.object.id || activity.object;
	let following;

	if (!id.startsWith(prefix)) {
		return null;
	}

	const { username, host } = parseAcct(id.slice(prefix.length));
	if (host !== null) {
		throw new Error();
	}

	const followee = await User.findOne({ username, host });
	if (followee === null) {
		throw new Error();
	}

	try {
		following = await Following.insert({
			createdAt: new Date(),
			followerId: actor._id,
			followeeId: followee._id
		});
	} catch (exception) {
		// duplicate key error
		if (exception instanceof MongoError && exception.code === 11000) {
			return null;
		}

		throw exception;
	}

	await new Promise((resolve, reject) => {
		queue.create('http', { type: 'follow', following: following._id }).save(error => {
			if (error) {
				reject(error);
			} else {
				resolve(null);
			}
		});
	});
};
