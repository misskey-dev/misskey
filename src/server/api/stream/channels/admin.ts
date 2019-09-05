import autobind from 'autobind-decorator';
import Channel from '../channel';

export default class extends Channel {
	public static shouldShare = true;
	public static requireCredential = true;
	public readonly chName = 'admin';

	@autobind
	public async init(params: any) {
		// Subscribe admin stream
		this.subscriber.on(`adminStream:${this.user!.id}`, data => {
			this.send(data);
		});
	}
}
