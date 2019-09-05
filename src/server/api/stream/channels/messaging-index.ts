import autobind from 'autobind-decorator';
import Channel from '../channel';

export default class extends Channel {
	public static shouldShare = true;
	public static requireCredential = true;
	public readonly chName = 'messagingIndex';

	@autobind
	public async init(params: any) {
		// Subscribe messaging index stream
		this.subscriber.on(`messagingIndexStream:${this.user!.id}`, data => {
			this.send(data);
		});
	}
}
