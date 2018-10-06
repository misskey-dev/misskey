import Channel from '../channel';

export default class extends Channel {
	public init = async (params: any) => {
		// Subscribe messaging index stream
		this.subscriber.on(`messagingIndexStream:${this.user._id}`, data => {
			this.send(data);
		});
	}
}
