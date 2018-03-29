import * as websocket from 'websocket';
import * as redis from 'redis';
import { ParsedUrlQuery } from 'querystring';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient): void {
	const q = request.resourceURL.query as ParsedUrlQuery;
	const channel = q.channel;

	// Subscribe channel stream
	subscriber.subscribe(`misskey:channel-stream:${channel}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});
}
