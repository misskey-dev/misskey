import * as websocket from 'websocket';
import * as redis from 'redis';
import { ParsedUrlQuery } from 'querystring';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	const q = request.resourceURL.query as ParsedUrlQuery;
	const listId = q.listId as string;

	// Subscribe stream
	subscriber.subscribe(`misskey:user-list-stream:${listId}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});
}
