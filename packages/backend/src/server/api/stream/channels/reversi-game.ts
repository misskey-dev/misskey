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

class ReversiGameChannel extends Channel {
	public readonly chName = 'reversiGame';
	public static shouldShare = false;
	public static requireCredential = false as const;
	private gameId: MiReversiGame['id'] | null = null;

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
			case 'accept': this.accept(true); break;
			case 'cancelAccept': this.accept(false); break;
			case 'updateSettings': this.updateSettings(body.key, body.value); break;
			case 'initForm': this.initForm(body); break;
			case 'updateForm': this.updateForm(body.id, body.value); break;
			case 'message': this.message(body); break;
			case 'putStone': this.putStone(body.pos); break;
			case 'check': this.check(body.crc32); break;
		}
	}

	@bindThis
	private async updateSettings(key: string, value: any) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (game.isStarted) return;
		if ((game.user1Id !== this.user.id) && (game.user2Id !== this.user.id)) return;
		if ((game.user1Id === this.user.id) && game.user1Accepted) return;
		if ((game.user2Id === this.user.id) && game.user2Accepted) return;

		if (!['map', 'bw', 'isLlotheo', 'canPutEverywhere', 'loopedBoard'].includes(key)) return;

		await this.reversiGamesRepository.update(this.gameId!, {
			[key]: value,
		});

		publishReversiGameStream(this.gameId!, 'updateSettings', {
			key: key,
			value: value,
		});
	}

	@bindThis
	private async initForm(form: any) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (game.isStarted) return;
		if ((game.user1Id !== this.user.id) && (game.user2Id !== this.user.id)) return;

		const set = game.user1Id === this.user.id ? {
			form1: form,
		} : {
			form2: form,
		};

		await this.reversiGamesRepository.update(this.gameId!, set);

		publishReversiGameStream(this.gameId!, 'initForm', {
			userId: this.user.id,
			form,
		});
	}

	@bindThis
	private async updateForm(id: string, value: any) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (game.isStarted) return;
		if ((game.user1Id !== this.user.id) && (game.user2Id !== this.user.id)) return;

		const form = game.user1Id === this.user.id ? game.form2 : game.form1;

		const item = form.find((i: any) => i.id == id);

		if (item == null) return;

		item.value = value;

		const set = game.user1Id === this.user.id ? {
			form2: form,
		} : {
			form1: form,
		};

		await this.reversiGamesRepository.update(this.gameId!, set);

		publishReversiGameStream(this.gameId!, 'updateForm', {
			userId: this.user.id,
			id,
			value,
		});
	}

	@bindThis
	private async message(message: any) {
		if (this.user == null) return;

		message.id = Math.random();
		publishReversiGameStream(this.gameId!, 'message', {
			userId: this.user.id,
			message,
		});
	}

	@bindThis
	private async accept(accept: boolean) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		this.reversiService.matchAccept(game, this.user, accept);
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
	private async check(crc32: string | number) {
		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (!game.isStarted) return;

		if (crc32.toString() !== game.crc32) {
			this.send('rescue', await ReversiGames.pack(game, this.user));
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
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ReversiGameChannel {
		return new ReversiGameChannel(
			this.reversiService,
			this.reversiGamesRepository,
			id,
			connection,
		);
	}
}
