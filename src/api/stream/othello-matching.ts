import * as websocket from 'websocket';
import * as redis from 'redis';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	const otherparty = request.resourceURL.query.otherparty;

	// Subscribe matching stream
	subscriber.subscribe(`misskey:othello-matching:${user._id}-${otherparty}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});
}
