import * as websocket from 'websocket';
import * as redis from 'redis';
import read from '../common/read-messaging-message';
import { ParsedUrlQuery } from 'querystring';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	const q = request.resourceURL.query as ParsedUrlQuery;
	const otherparty = q.otherparty as string;

	// Subscribe messaging stream
	subscriber.subscribe(`misskey:messaging-stream:${user._id}-${otherparty}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});

	connection.on('message', async (data) => {
		const msg = JSON.parse(data.utf8Data);

		switch (msg.type) {
			case 'read':
				if (!msg.id) return;
				read(user._id, otherparty, msg.id);
				break;
		}
	});
}
