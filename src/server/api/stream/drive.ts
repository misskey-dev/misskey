import { Channel } from '.';

export default class extends Channel {
	public init = async (params: any) => {
		// Subscribe drive stream
		this.subscriber.on(`driveStream:${this.user._id}`, data => {
			this.send(data);
		});
	}
}
