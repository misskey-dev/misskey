import autobind from 'autobind-decorator';
import Channel from '../channel';

export default class extends Channel {
	public readonly chName = 'apLog';
	public static shouldShare = true;

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
