import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		// Subscribe drive stream
		this.connection.subscriber.on(`drive-stream:${this.connection.user._id}`, data => {
			this.send(data);
		});
	}
}
