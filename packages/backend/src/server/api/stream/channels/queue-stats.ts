import Xev from 'xev';
import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import Channel from '../channel.js';

const ev = new Xev();

class QueueStatsChannel extends Channel {
	public readonly chName = 'queueStats';
	public static shouldShare = true;
	public static requireCredential = false;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		//this.onStats = this.onStats.bind(this);
		//this.onMessage = this.onMessage.bind(this);
	}

	@bindThis
	public async init(params: any) {
		ev.addListener('queueStats', this.onStats);
	}

	@bindThis
	private onStats(stats: any) {
		this.send('stats', stats);
	}

	@bindThis
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'requestLog':
				ev.once(`queueStatsLog:${body.id}`, statsLog => {
					this.send('statsLog', statsLog);
				});
				ev.emit('requestQueueStatsLog', {
					id: body.id,
					length: body.length,
				});
				break;
		}
	}

	@bindThis
	public dispose() {
		ev.removeListener('queueStats', this.onStats);
	}
}

@Injectable()
export class QueueStatsChannelService {
	public readonly shouldShare = QueueStatsChannel.shouldShare;
	public readonly requireCredential = QueueStatsChannel.requireCredential;

	constructor(
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): QueueStatsChannel {
		return new QueueStatsChannel(
			id,
			connection,
		);
	}
}
