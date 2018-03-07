import * as websocket from 'websocket';
import * as redis from 'redis';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient): void {
	const game = request.resourceURL.query.game;

	// Subscribe game stream
	subscriber.subscribe(`misskey:othello-game-stream:${game}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});
}
