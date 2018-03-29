import * as websocket from 'websocket';
import * as redis from 'redis';
import * as debug from 'debug';

import User from '../../../models/user';
import Mute from '../../../models/mute';
import { pack as packPost } from '../../../models/post';
import readNotification from '../common/read-notification';

const log = debug('misskey');

export default async function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any) {
	// Subscribe Home stream channel
	subscriber.subscribe(`misskey:user-stream:${user._id}`);

	const mute = await Mute.find({
		muterId: user._id,
		deletedAt: { $exists: false }
	});
	const mutedUserIds = mute.map(m => m.muteeId.toString());

	subscriber.on('message', async (channel, data) => {
		switch (channel.split(':')[1]) {
			case 'user-stream':
				try {
					const x = JSON.parse(data);

					if (x.type == 'post') {
						if (mutedUserIds.indexOf(x.body.userId) != -1) {
							return;
						}
						if (x.body.reply != null && mutedUserIds.indexOf(x.body.reply.userId) != -1) {
							return;
						}
						if (x.body.repost != null && mutedUserIds.indexOf(x.body.repost.userId) != -1) {
							return;
						}
					} else if (x.type == 'notification') {
						if (mutedUserIds.indexOf(x.body.userId) != -1) {
							return;
						}
					}

					connection.send(data);
				} catch (e) {
					connection.send(data);
				}
				break;
			case 'post-stream':
				const postId = channel.split(':')[2];
				log(`RECEIVED: ${postId} ${data} by @${user.username}`);
				const post = await packPost(postId, user, {
					detail: true
				});
				connection.send(JSON.stringify({
					type: 'post-updated',
					body: {
						post: post
					}
				}));
				break;
		}
	});

	connection.on('message', data => {
		const msg = JSON.parse(data.utf8Data);

		switch (msg.type) {
			case 'api':
				// TODO
				break;

			case 'alive':
				// Update lastUsedAt
				User.update({ _id: user._id }, {
					$set: {
						'account.lastUsedAt': new Date()
					}
				});
				break;

			case 'read_notification':
				if (!msg.id) return;
				readNotification(user._id, msg.id);
				break;

			case 'capture':
				if (!msg.id) return;
				const postId = msg.id;
				log(`CAPTURE: ${postId} by @${user.username}`);
				subscriber.subscribe(`misskey:post-stream:${postId}`);
				break;
		}
	});
}
