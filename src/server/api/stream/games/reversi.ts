import * as mongo from 'mongodb';
import Matching, { pack } from '../../../../models/games/reversi/matching';
import { publishMainStream } from '../../../../stream';
import { Channel } from '..';

export default class extends Channel {
	public init = async (params: any) => {
		// Subscribe reversi stream
		this.connection.subscriber.on(`reversi-stream:${this.user._id}`, data => {
			this.send(data);
		});
	}

	public onMessage = async (type: string, body: any) => {
		switch (type) {
			case 'ping':
				if (body.id == null) return;
				const matching = await Matching.findOne({
					parentId: this.user._id,
					childId: new mongo.ObjectID(body.id)
				});
				if (matching == null) return;
				publishMainStream(matching.childId, 'reversi_invited', await pack(matching, matching.childId));
				break;
		}
	}
}
