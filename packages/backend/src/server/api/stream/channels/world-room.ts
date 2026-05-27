/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { JsonObject } from '@/misc/json-value.js';
import { WorldRoomService } from '@/core/WorldRoomService.js';
import { WorldRoomMultiplayService } from '@/core/WorldRoomMultiplayService.js';
import Channel, { type ChannelRequest } from '../channel.js';

@Injectable({ scope: Scope.TRANSIENT })
export class WorldRoomChannel extends Channel {
	public readonly chName = 'worldRoom';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:worldRoom';
	private roomId: string;
	private intervalId: NodeJS.Timeout;
	private isEntered = false;

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,

		private worldRoomService: WorldRoomService,
		private worldRoomMultiplayService: WorldRoomMultiplayService,
	) {
		super(request);
	}

	@bindThis
	public async init(params: JsonObject): Promise<boolean> {
		if (typeof params.roomId !== 'string') return false;
		if (!this.user) return false;

		this.roomId = params.roomId;

		const room = await this.worldRoomService.findRoomById(this.roomId);
		if (room == null) return false;

		try {
			await this.enter();
		} catch (err) {
			return false;
		}

		this.subscriber.on(`worldRoomStream:${this.roomId}`, this.onEvent);

		return true;
	}

	@bindThis
	private async enter() {
		if (this.isEntered) return;

		await this.worldRoomMultiplayService.enter(this.user!.id, this.roomId);

		this.isEntered = true;

		this.send('entered', {
			playerProfiles: await this.worldRoomMultiplayService.getPlayerProfiles(this.roomId, this.user!.id),
		});

		this.intervalId = setInterval(async () => {
			const states = await this.worldRoomMultiplayService.getPlayerStatesAndHeatbeat(this.user!.id, this.roomId);
			delete states[this.user!.id];
			this.send('sync', states);
		}, 100);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['worldRoom']['payload']) {
		switch (data.type) {
			case 'enter': {
				if (data.body.user.id === this.user!.id) return; // 自分の入室は無視
				this.send('playerEntered', {
					id: data.body.user.id,
					profile: this.worldRoomMultiplayService.packPlayerProfile(data.body.user.id),
				});
				break;
			}
			case 'left': {
				if (data.body.userId === this.user!.id) return; // 自分の退室は無視
				this.send('playerLeft', {
					id: data.body.userId,
				});
				break;
			}
		}
	}

	@bindThis
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'update':
				if (this.roomId && this.isEntered) {
					this.worldRoomMultiplayService.updatePlayerState(this.user!.id, this.roomId, body);
				}
				break;
		}
	}

	@bindThis
	public dispose() {
		this.subscriber.off(`worldRoomStream:${this.roomId}`, this.onEvent);

		clearInterval(this.intervalId);
		this.worldRoomMultiplayService.left(this.user!.id, this.roomId);
	}
}
