import * as websocket from 'websocket';
import * as redis from 'redis';
import * as debug from 'debug';

import User from '../models/user';
import serializePost from '../serializers/post';

const log = debug('misskey');

export default function homeStream(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	// Subscribe Home stream channel
	subscriber.subscribe(`misskey:user-stream:${user._id}`);

	subscriber.on('message', async (channel, data) => {
		switch (channel.split(':')[1]) {
			case 'user-stream':
				connection.send(data);
				break;
			case 'post-stream':
				const postId = channel.split(':')[2];
				log(`RECEIVED: ${postId} ${data} by @${user.username}`);
				const post = await serializePost(postId, user, {
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
			case 'alive':
				// Update lastUsedAt
				User.update({ _id: user._id }, {
					$set: {
						last_used_at: new Date()
					}
				});
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
