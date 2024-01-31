/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { MahjongService } from '@/core/MahjongService.js';
import { GlobalEvents } from '@/core/GlobalEventService.js';
import Channel, { type MiChannelService } from '../channel.js';

class MahjongRoomChannel extends Channel {
	public readonly chName = 'mahjongRoom';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:account';
	private roomId: string | null = null;

	constructor(
		private mahjongService: MahjongService,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: any) {
		this.roomId = params.roomId as string;

		this.subscriber.on(`mahjongRoomStream:${this.roomId}`, this.onMahjongRoomStreamMessage);
	}

	@bindThis
	private async onMahjongRoomStreamMessage(message: GlobalEvents['mahjongRoom']['payload']) {
		if (message.type === 'started') {
			const packed = await this.mahjongService.packRoom(message.body.room, this.user!);
			this.send('started', {
				room: packed,
			});
		} else {
			this.send(message.type, message.body);
		}
	}

	@bindThis
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'ready': this.ready(body); break;
			case 'updateSettings': this.updateSettings(body.key, body.value); break;
			case 'addAi': this.addAi(); break;
			case 'confirmNextKyoku': this.confirmNextKyoku(); break;
			case 'dahai': this.dahai(body.tile, body.riichi); break;
			case 'tsumoHora': this.tsumoHora(); break;
			case 'ronHora': this.ronHora(); break;
			case 'pon': this.pon(); break;
			case 'nop': this.nop(); break;
			case 'claimTimeIsUp': this.claimTimeIsUp(); break;
		}
	}

	@bindThis
	private async updateSettings(key: string, value: any) {
		if (this.user == null) return;

		this.mahjongService.updateSettings(this.roomId!, this.user, key, value);
	}

	@bindThis
	private async ready(ready: boolean) {
		if (this.user == null) return;

		this.mahjongService.changeReadyState(this.roomId!, this.user, ready);
	}

	@bindThis
	private async confirmNextKyoku() {
		if (this.user == null) return;

		this.mahjongService.confirmNextKyoku(this.roomId!, this.user);
	}

	@bindThis
	private async addAi() {
		if (this.user == null) return;

		this.mahjongService.addAi(this.roomId!, this.user);
	}

	@bindThis
	private async dahai(tile: string, riichi = false) {
		if (this.user == null) return;

		this.mahjongService.commit_dahai(this.roomId!, this.user, tile, riichi);
	}

	@bindThis
	private async tsumoHora() {
		if (this.user == null) return;

		this.mahjongService.commit_tsumoHora(this.roomId!, this.user);
	}

	@bindThis
	private async ronHora() {
		if (this.user == null) return;

		this.mahjongService.commit_ronHora(this.roomId!, this.user);
	}

	@bindThis
	private async pon() {
		if (this.user == null) return;

		this.mahjongService.commit_pon(this.roomId!, this.user);
	}

	@bindThis
	private async nop() {
		if (this.user == null) return;

		this.mahjongService.commit_nop(this.roomId!, this.user);
	}

	@bindThis
	private async claimTimeIsUp() {
		if (this.user == null) return;

		this.mahjongService.checkTimeout(this.roomId!);
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`mahjongRoomStream:${this.roomId}`, this.onMahjongRoomStreamMessage);
	}
}

@Injectable()
export class MahjongRoomChannelService implements MiChannelService<true> {
	public readonly shouldShare = MahjongRoomChannel.shouldShare;
	public readonly requireCredential = MahjongRoomChannel.requireCredential;
	public readonly kind = MahjongRoomChannel.kind;

	constructor(
		private mahjongService: MahjongService,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): MahjongRoomChannel {
		return new MahjongRoomChannel(
			this.mahjongService,
			id,
			connection,
		);
	}
}
