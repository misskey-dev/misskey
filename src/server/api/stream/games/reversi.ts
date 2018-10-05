import * as mongo from 'mongodb';
import Matching, { pack } from '../../../../models/games/reversi/matching';
import { publishMainStream } from '../../../../stream';
import { Channel } from '..';

export default class extends Channel {
	public init = async (params: any) => {
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
					publishMainStream(matching.childId, 'reversi_invited', await pack(matching, matching.childId));
					break;
			}
		});
	}
}
