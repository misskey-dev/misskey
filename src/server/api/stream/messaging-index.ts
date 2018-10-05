import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		// Subscribe messaging index stream
		subscriber.on(`messaging-index-stream:${user._id}`, data => {
			connection.send(JSON.stringify(data));
		});
	}
}
