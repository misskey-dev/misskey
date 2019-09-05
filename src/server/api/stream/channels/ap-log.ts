import autobind from 'autobind-decorator';
import Channel from '../channel';

export default class extends Channel {
	public static shouldShare = true;
	public static requireCredential = false;
	public readonly chName = 'apLog';

	@autobind
	public async init(params: any) {
		// Subscribe events
		this.subscriber.on('apLog', this.onLog);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('apLog', this.onLog);
	}

	@autobind
	private async onLog(log: any) {
		this.send('log', log);
	}
}
