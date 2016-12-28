import * as mongodb from 'mongodb';
import * as websocket from 'websocket';
import * as redis from 'redis';
import Message from '../models/messaging-message';
import { publishMessagingStream } from '../event';

export default function messagingStream(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	const otherparty = request.resourceURL.query.otherparty;

	// Subscribe messaging stream
	subscriber.subscribe(`misskey:messaging-stream:${user._id}-${otherparty}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});

	connection.on('message', async (data) => {
		const msg = JSON.parse(data.utf8Data);

		switch (msg.type) {
			case 'read':
					if (!msg.id) {
						return;
					}

					const id = new mongodb.ObjectID(msg.id);

					// Fetch message
					// SELECT _id, user_id, is_read
					const message = await Message.findOne({
						_id: id,
						recipient_id: user._id
					}, {
						fields: {
							_id: true,
							user_id: true,
							is_read: true
						}
					});

					if (message == null) {
						return;
					}

					if (message.is_read) {
						return;
					}

					// Update documents
					await Message.update({
						_id: id
					}, {
						$set: { is_read: true }
					});

					// Publish event
					publishMessagingStream(message.user_id, user._id, 'read', id.toString());
				break;
		}
	});
}
