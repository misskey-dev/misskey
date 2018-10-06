import Xev from 'xev';
import Channel from '.';

const ev = new Xev();

export default class extends Channel {
	public init = async (params: any) => {
		ev.addListener('serverStats', this.onStats);
	}

	private onStats = (stats: any) => {
		this.send('stats', stats);
	}

	public onMessage = (type: string, body: any) => {
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

	public dispose = () => {
		ev.removeListener('serverStats', this.onStats);
	}
}
