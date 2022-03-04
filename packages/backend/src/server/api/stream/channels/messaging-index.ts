import Channel from '../channel.js';

export default class extends Channel {
	public readonly chName = 'messagingIndex';
	public static shouldShare = true;
	public static requireCredential = true;

	public async init(params: any) {
		// Subscribe messaging index stream
		this.subscriber.on(`messagingIndexStream:${this.user!.id}`, data => {
			this.send(data);
		});
	}
}
