import { MongoError } from 'mongodb';
import parseAcct from '../../../acct/parse';
import Following, { IFollowing } from '../../../models/following';
import User from '../../../models/user';
import config from '../../../config';
import queue from '../../../queue';
import context from '../renderer/context';
import renderAccept from '../renderer/accept';
import request from '../../request';

export default async (resolver, actor, activity, distribute) => {
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

	if (!distribute) {
		const { _id } = await Following.findOne({
			followerId: actor._id,
			followeeId: followee._id
		})

		return {
			resolver,
			object: { $ref: 'following', $id: _id }
		};
	}

	const promisedFollowing = Following.insert({
		createdAt: new Date(),
		followerId: actor._id,
		followeeId: followee._id
	}).then(following => new Promise((resolve, reject) => {
		queue.create('http', {
			type: 'follow',
			following: following._id
		}).save(error => {
			if (error) {
				reject(error);
			} else {
				resolve(following);
			}
		});
	}) as Promise<IFollowing>, async error => {
		// duplicate key error
		if (error instanceof MongoError && error.code === 11000) {
			return Following.findOne({
				followerId: actor._id,
				followeeId: followee._id
			});
		}

		throw error;
	});

	const accept = renderAccept(activity);
	accept['@context'] = context;

	await request(followee, actor.account.inbox, accept);

	return promisedFollowing.then(({ _id }) => ({
		resolver,
		object: { $ref: 'following', $id: _id }
	}));
};
