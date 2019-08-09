import autobind from 'autobind-decorator';
import Channel from '~/server/api/stream/channel';

export default class extends Channel {
	public readonly chName = 'apLog';
	public static shouldShare = true;
	public static requireCredential = false;

	@autobind
	public async init(params: any) {
		// Subscribe events
		this.subscriber.on('apLog', this.onLog);
	}

	@autobind
	private async onLog(log: any) {
		this.send('log', log);
	}

	@autobind
	public dispose() {
		// Unsubscribe events
		this.subscriber.off('apLog', this.onLog);
	}
}
