import autobind from 'autobind-decorator';
import Channel from '../channel';

export default class extends Channel {
	public readonly chName = 'apLog';
	public static shouldShare = true;
	public static requireCredential = false;

	@autobind
	public async init(params: unknown) {
		// Subscribe events
		this.subscriber.on('apLog', this.onLog);
	}

	@autobind
	private async onLog(log: unknown) {
		this.send('log', log);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('apLog', this.onLog);
	}
}
