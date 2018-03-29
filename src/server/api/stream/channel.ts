import * as websocket from 'websocket';
import * as redis from 'redis';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient): void {
	const channel = request.resourceURL.query.channel;

	// Subscribe channel stream
	subscriber.subscribe(`misskey:channel-stream:${channel}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});
}
