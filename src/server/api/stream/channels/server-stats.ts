import autobind from 'autobind-decorator';
import Xev from 'xev';
import Channel from '../channel';

const ev = new Xev();

export default class extends Channel {
	public static shouldShare = true;
	public static requireCredential = false;
	public readonly chName = 'serverStats';

	@autobind
	public async init(params: any) {
		ev.addListener('serverStats', this.onStats);
	}

	@autobind
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'requestLog':
				ev.once(`serverStatsLog:${body.id}`, statsLog => {
					this.send('statsLog', statsLog);
				});
				ev.emit('requestServerStatsLog', {
					id: body.id,
					length: body.length
				});
				break;
		}
	}

	@autobind
	public dispose() {
		ev.removeListener('serverStats', this.onStats);
	}

	@autobind
	private onStats(stats: any) {
		this.send('stats', stats);
	}
}
