import { MongoError } from 'mongodb';
import parseAcct from '../../../acct/parse';
import Following from '../../../models/following';
import User from '../../../models/user';
import config from '../../../config';
import queue from '../../../queue';
import context from '../renderer/context';
import renderAccept from '../renderer/accept';
import request from '../../request';

export default async (actor, activity) => {
	const prefix = config.url + '/@';
	const id = activity.object.id || activity.object;

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

	const accept = renderAccept(activity);
	accept['@context'] = context;

	await Promise.all([
		request(followee, actor.account.inbox, accept),

		Following.insert({
			createdAt: new Date(),
			followerId: actor._id,
			followeeId: followee._id
		}).then(following => new Promise((resolve, reject) => {
			queue.create('http', { type: 'follow', following: following._id }).save(error => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		}), error => {
			// duplicate key error
			if (error instanceof MongoError && error.code === 11000) {
				return;
			}

			throw error;
		})
	]);

	return null;
};
