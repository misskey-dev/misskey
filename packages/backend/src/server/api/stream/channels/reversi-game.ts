/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiReversiGame, ReversiGamesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { ReversiService } from '@/core/ReversiService.js';
import { ReversiGameEntityService } from '@/core/entities/ReversiGameEntityService.js';
import Channel, { type MiChannelService } from '../channel.js';

class ReversiGameChannel extends Channel {
	public readonly chName = 'reversiGame';
	public static shouldShare = false;
	public static requireCredential = false as const;
	private gameId: MiReversiGame['id'] | null = null;

	constructor(
		private reversiService: ReversiService,
		private reversiGamesRepository: ReversiGamesRepository,
		private reversiGameEntityService: ReversiGameEntityService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: any) {
		this.gameId = params.gameId as string;

		const game = await this.reversiGamesRepository.findOneBy({
			id: this.gameId,
		});
		if (game == null) return;

		this.subscriber.on(`reversiGameStream:${this.gameId}`, this.send);
	}

	@bindThis
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'ready': this.ready(body); break;
			case 'updateSettings': this.updateSettings(body.key, body.value); break;
			case 'putStone': this.putStone(body.pos); break;
			case 'syncState': this.syncState(body.crc32); break;
		}
	}

	@bindThis
	private async updateSettings(key: string, value: any) {
		if (this.user == null) return;

		// TODO: キャッシュしたい
		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		this.reversiService.updateSettings(game, this.user, key, value);
	}

	@bindThis
	private async ready(ready: boolean) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		this.reversiService.gameReady(game, this.user, ready);
	}

	@bindThis
	private async putStone(pos: number) {
		if (this.user == null) return;

		// TODO: キャッシュしたい
		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		this.reversiService.putStoneToGame(game, this.user, pos);
	}

	@bindThis
	private async syncState(crc32: string | number) {
		// TODO: キャッシュしたい
		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (!game.isStarted) return;

		if (crc32.toString() !== game.crc32) {
			this.send('rescue', await this.reversiGameEntityService.packDetail(game, this.user));
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`reversiGameStream:${this.gameId}`, this.send);
	}
}

@Injectable()
export class ReversiGameChannelService implements MiChannelService<false> {
	public readonly shouldShare = ReversiGameChannel.shouldShare;
	public readonly requireCredential = ReversiGameChannel.requireCredential;
	public readonly kind = ReversiGameChannel.kind;

	constructor(
		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private reversiService: ReversiService,
		private reversiGameEntityService: ReversiGameEntityService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ReversiGameChannel {
		return new ReversiGameChannel(
			this.reversiService,
			this.reversiGamesRepository,
			this.reversiGameEntityService,
			id,
			connection,
		);
	}
}
