import Xev from 'xev';
import { Inject, Injectable } from '@nestjs/common';
import Channel from '../channel.js';

const ev = new Xev();

class ServerStatsChannel extends Channel {
	public readonly chName = 'serverStats';
	public static shouldShare = true;
	public static requireCredential = false;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		this.onStats = this.onStats.bind(this);
		this.onMessage = this.onMessage.bind(this);
	}

	public async init(params: any) {
		ev.addListener('serverStats', this.onStats);
	}

	private onStats(stats: any) {
		this.send('stats', stats);
	}

	public onMessage(type: string, body: any) {
		switch (type) {
			case 'requestLog':
				ev.once(`serverStatsLog:${body.id}`, statsLog => {
					this.send('statsLog', statsLog);
				});
				ev.emit('requestServerStatsLog', {
					id: body.id,
					length: body.length,
				});
				break;
		}
	}

	public dispose() {
		ev.removeListener('serverStats', this.onStats);
	}
}

@Injectable()
export class ServerStatsChannelService {
	public readonly shouldShare = ServerStatsChannel.shouldShare;
	public readonly requireCredential = ServerStatsChannel.requireCredential;

	constructor(
	) {
	}

	public create(id: string, connection: Channel['connection']): ServerStatsChannel {
		return new ServerStatsChannel(
			id,
			connection,
		);
	}
}
