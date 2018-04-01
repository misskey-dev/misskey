import { request } from 'https';
import { sign } from 'http-signature';
import { URL } from 'url';
import User, { ILocalAccount, IRemoteAccount, pack as packUser } from '../../models/user';
import Following from '../../models/following';
import event from '../../common/event';
import notify from '../../common/notify';
import context from '../../common/remote/activitypub/renderer/context';
import render from '../../common/remote/activitypub/renderer/follow';
import config from '../../conf';

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

		// Increment followers count
		User.update({ _id: followeeId }, {
			$inc: {
				followersCount: 1
			}
		}),

		// Notify
		promisedFollowee.then(followee => followee.host === null ?
			notify(followeeId, followerId, 'follow') : null),

		// Publish follow event
		Promise.all([promisedFollower, promisedFollowee]).then(([follower, followee]) => {
			const followerEvent = packUser(followee, follower)
				.then(packed => event(follower._id, 'follow', packed));
			let followeeEvent;

			if (followee.host === null) {
				followeeEvent = packUser(follower, followee)
					.then(packed => event(followee._id, 'followed', packed));
			} else {
				followeeEvent = new Promise((resolve, reject) => {
					const {
						protocol,
						hostname,
						port,
						pathname,
						search
					} = new URL((followee.account as IRemoteAccount).inbox);

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
						key: (follower.account as ILocalAccount).keypair,
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
