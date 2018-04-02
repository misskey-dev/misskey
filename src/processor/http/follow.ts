import { request } from 'https';
import { sign } from 'http-signature';
import { URL } from 'url';
import User, { isLocalUser, pack as packUser } from '../../models/user';
import Following from '../../models/following';
import FollowingLog from '../../models/following-log';
import FollowedLog from '../../models/followed-log';
import event from '../../publishers/stream';
import notify from '../../publishers/notify';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/follow';
import config from '../../config';

export default ({ data }, done) => Following.findOne({ _id: data.following }).then(({ followerId, followeeId }) => {
	const promisedFollower = User.findOne({ _id: followerId });
	const promisedFollowee = User.findOne({ _id: followeeId });

	return Promise.all([
		// Increment following count
		User.update(followerId, {
			$inc: {
				followingCount: 1
			}
		}),

		promisedFollower.then(({ followingCount }) => FollowingLog.insert({
			userId: followerId,
			count: followingCount + 1
		})),

		// Increment followers count
		User.update({ _id: followeeId }, {
			$inc: {
				followersCount: 1
			}
		}),

		promisedFollowee.then(({ followersCount }) => FollowedLog.insert({
			userId: followerId,
			count: followersCount + 1
		})),

		// Notify
		promisedFollowee.then(followee => followee.host === null ?
			notify(followeeId, followerId, 'follow') : null),

		// Publish follow event
		Promise.all([promisedFollower, promisedFollowee]).then(([follower, followee]) => {
			let followerEvent;
			let followeeEvent;

			if (isLocalUser(follower)) {
				followerEvent = packUser(followee, follower)
					.then(packed => event(follower._id, 'follow', packed));
			}

			if (isLocalUser(followee)) {
				followeeEvent = packUser(follower, followee)
					.then(packed => event(followee._id, 'followed', packed));
			} else if (isLocalUser(follower)) {
				followeeEvent = new Promise((resolve, reject) => {
					const {
						protocol,
						hostname,
						port,
						pathname,
						search
					} = new URL(followee.account.inbox);

					const req = request({
						protocol,
						hostname,
						port,
						method: 'POST',
						path: pathname + search,
					}, res => {
						res.on('close', () => {
							if (res.statusCode >= 200 && res.statusCode < 300) {
								resolve();
							} else {
								reject(res);
							}
						});

						res.on('data', () => {});
						res.on('error', reject);
					});

					sign(req, {
						authorizationHeaderName: 'Signature',
						key: follower.account.keypair,
						keyId: `acct:${follower.username}@${config.host}`
					});

					const rendered = render(follower, followee);
					rendered['@context'] = context;

					req.end(JSON.stringify(rendered));
				});
			}

			return Promise.all([followerEvent, followeeEvent]);
		})
	]);
}).then(done, done);
