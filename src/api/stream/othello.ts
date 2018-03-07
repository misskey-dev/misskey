import * as websocket from 'websocket';
import * as redis from 'redis';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	// Subscribe othello stream
	subscriber.subscribe(`misskey:othello-stream:${user._id}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});
}
