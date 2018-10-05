import read from '../common/read-messaging-message';
import { ParsedUrlQuery } from 'querystring';
import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		const q = request.resourceURL.query as ParsedUrlQuery;
		const otherparty = q.otherparty as string;

		// Subscribe messaging stream
		subscriber.on(`messaging-stream:${user._id}-${otherparty}`, data => {
			connection.send(JSON.stringify(data));
		});

		connection.on('message', async (data) => {
			const msg = JSON.parse(data.utf8Data);

			switch (msg.type) {
				case 'read':
					if (!msg.id) return;
					read(user._id, otherparty, msg.id);
					break;
			}
		});
	}
}
