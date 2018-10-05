import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		// Subscribe drive stream
		subscriber.on(`drive-stream:${user._id}`, data => {
			connection.send(JSON.stringify(data));
		});
	}
}
