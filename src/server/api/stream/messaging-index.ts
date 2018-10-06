import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		// Subscribe messaging index stream
		this.subscriber.on(`messaging-index-stream:${this.user._id}`, data => {
			this.send(data);
		});
	}
}
