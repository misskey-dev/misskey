import autobind from 'autobind-decorator';
import Xev from 'xev';
import Channel from '../channel';

const ev = new Xev();

export default class extends Channel {
	public static shouldShare = true;
	public static requireCredential = false;
	public readonly chName = 'notesStats';

	@autobind
	public async init(params: any) {
		ev.addListener('notesStats', this.onStats);
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

	@autobind
	private onStats(stats: any) {
		this.send('stats', stats);
	}
}
