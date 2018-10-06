import Xev from 'xev';
import Channel from '.';

const ev = new Xev();

export default class extends Channel {
	public init = async (params: any) => {
		ev.addListener('notesStats', this.onStats);
	}

	private onStats = (stats: any) => {
		this.send('stats', stats);
	}

	public onMessage = (type: string, body: any) => {
		switch (type) {
			case 'requestLog':
				ev.once(`notesStatsLog:${body.id}`, statsLog => {
					this.send('statsLog', statsLog);
				});
				ev.emit('requestNotesStatsLog', body.id);
				break;
		}
	}

	public dispose = () => {
		ev.removeListener('notesStats', this.onStats);
	}
}
