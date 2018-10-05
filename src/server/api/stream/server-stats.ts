import Xev from 'xev';
import { Channel } from '.';

const ev = new Xev();

export default class extends Channel {
	public init = async (params: any) => {
		const onStats = (stats: any) => {
			connection.send(JSON.stringify({
				type: 'stats',
				body: stats
			}));
		};

		connection.on('message', async data => {
			const msg = JSON.parse(data.utf8Data);

			switch (msg.type) {
				case 'requestLog':
					ev.once(`serverStatsLog:${msg.id}`, statsLog => {
						connection.send(JSON.stringify({
							type: 'statsLog',
							body: statsLog
						}));
					});
					ev.emit('requestServerStatsLog', {
						id: msg.id,
						length: msg.length
					});
					break;
			}
		});

		ev.addListener('serverStats', onStats);

		connection.on('close', () => {
			ev.removeListener('serverStats', onStats);
		});
	}
}
