import * as mongo from 'mongodb';
import * as websocket from 'websocket';
import Xev from 'xev';
import Matching, { pack } from '../../../../models/games/reversi/matching';
import { publishUserStream } from '../../../../stream';

export default function(request: websocket.request, connection: websocket.connection, subscriber: Xev, user: any): void {
	// Subscribe reversi stream
	subscriber.on(`reversi-stream:${user._id}`, data => {
		connection.send(JSON.stringify(data));
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
				publishUserStream(matching.childId, 'reversi_invited', await pack(matching, matching.childId));
				break;
		}
	});
}
