import * as mongo from 'mongodb';
import * as websocket from 'websocket';
import * as redis from 'redis';
import Matching, { pack } from '../models/othello-matching';
import publishUserStream from '../event';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	// Subscribe othello stream
	subscriber.subscribe(`misskey:othello-stream:${user._id}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});

	connection.on('message', async (data) => {
		const msg = JSON.parse(data.utf8Data);

		switch (msg.type) {
			case 'ping':
				if (msg.id == null) return;
				const matching = await Matching.findOne({
					parent_id: user._id,
					child_id: new mongo.ObjectID(msg.id)
				});
				if (matching == null) return;
				publishUserStream(matching.child_id, 'othello_invited', await pack(matching, matching.child_id));
				break;
		}
	});
}
