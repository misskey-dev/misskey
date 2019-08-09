import autobind from 'autobind-decorator';
import Xev from 'xev';
import Channel from '~/server/api/stream/channel';

const ev = new Xev();

export default class extends Channel {
	public readonly chName = 'notesStats';
	public static shouldShare = true;
	public static requireCredential = false;

	@autobind
	public async init(params: any) {
		ev.addListener('notesStats', this.onStats);
	}

	@autobind
	private onStats(stats: any) {
		this.send('stats', stats);
	}

	@autobind
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'requestLog':
				ev.once(`notesStatsLog:${body.id}`, statsLog => {
					this.send('statsLog', statsLog);
				});
				ev.emit('requestNotesStatsLog', body.id);
				break;
		}
	}

	@autobind
	public dispose() {
		ev.removeListener('notesStats', this.onStats);
	}
}
