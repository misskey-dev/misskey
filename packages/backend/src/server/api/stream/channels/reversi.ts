/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as CRC32 from 'crc-32';
import type { MiReversiGame, MiUser, ReversiGamesRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { ReversiService } from '@/core/ReversiService.js';
import Channel, { type MiChannelService } from '../channel.js';

class ReversiChannel extends Channel {
	public readonly chName = 'reversi';
	public static shouldShare = true;
	public static requireCredential = true as const;
	public static kind = 'read:account';

	constructor(
		private reversiService: ReversiService,
		private reversiGamesRepository: ReversiGamesRepository,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: any) {
		this.subscriber.on(`reversiStream:${this.user.id}`, this.send);
	}

	@bindThis
	public async async onMessage(type: string, body: any) {
		switch (type) {
			case 'ping': {
				if (body.id == null) return;
				const matching = await ReversiMatchings.findOne({
					parentId: this.user!.id,
					childId: body.id,
				});
				if (matching == null) return;
				publishMainStream(matching.childId, 'reversiInvited', await ReversiMatchings.pack(matching, { id: matching.childId }));
				break;
			}
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`reversiStream:${this.user.id}`, this.send);
	}
}

@Injectable()
export class ReversiChannelService implements MiChannelService<true> {
	public readonly shouldShare = ReversiChannel.shouldShare;
	public readonly requireCredential = ReversiChannel.requireCredential;
	public readonly kind = ReversiChannel.kind;

	constructor(
		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private reversiService: ReversiService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ReversiChannel {
		return new ReversiChannel(
			this.reversiService,
			this.reversiGamesRepository,
			id,
			connection,
		);
	}
}
