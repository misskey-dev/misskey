import * as websocket from 'websocket';
import * as redis from 'redis';

export default function homeStream(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	// Subscribe Home stream channel
	subscriber.subscribe(`misskey:user-stream:${user._id}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});
}
