/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Xev from 'xev';
import { Injectable } from '@nestjs/common';
import { bindThis } from '@/decorators.js';
import Channel, { type MiChannelService } from '../channel.js';

const ev = new Xev();

class ServerStatsChannel extends Channel {
	public readonly chName = 'serverStats';
	public static shouldShare = true;
	public static requireCredential = false as const;

	constructor(id: string, connection: Channel['connection']) {
		super(id, connection);
		//this.onStats = this.onStats.bind(this);
		//this.onMessage = this.onMessage.bind(this);
	}

	@bindThis
	public async init(params: any) {
		ev.addListener('serverStats', this.onStats);
	}

	@bindThis
	private onStats(stats: any) {
		this.send('stats', stats);
	}

	@bindThis
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

	@bindThis
	public dispose() {
		ev.removeListener('serverStats', this.onStats);
	}
}

@Injectable()
export class ServerStatsChannelService implements MiChannelService<false> {
	public readonly shouldShare = ServerStatsChannel.shouldShare;
	public readonly requireCredential = ServerStatsChannel.requireCredential;
	public readonly kind = ServerStatsChannel.kind;

	constructor(
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ServerStatsChannel {
		return new ServerStatsChannel(
			id,
			connection,
		);
	}
}
