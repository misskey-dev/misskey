import * as mongo from 'mongodb';
import * as websocket from 'websocket';
import * as redis from 'redis';
import Matching, { pack } from '../../../models/othello-matching';
import publishUserStream from '../../../common/event';

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
					parentId: user._id,
					childId: new mongo.ObjectID(msg.id)
				});
				if (matching == null) return;
				publishUserStream(matching.childId, 'othello_invited', await pack(matching, matching.childId));
				break;
		}
	});
}
