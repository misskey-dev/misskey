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
import { WorldMultiplayService } from '@/core/WorldMultiplayService.js';
import Channel, { type ChannelRequest } from '../channel.js';

@Injectable({ scope: Scope.TRANSIENT })
export class WorldChannel extends Channel {
	public readonly chName = 'world';
	public static shouldShare = false;
	public static requireCredential = true as const;
	public static kind = 'read:world';
	private roomId: string;
	private spaceKey: string;
	private intervalId: NodeJS.Timeout;
	private isEntered = false;

	constructor(
		@Inject(REQUEST)
		request: ChannelRequest,

		private worldRoomService: WorldRoomService,
		private worldMultiplayService: WorldMultiplayService,
	) {
		super(request);
	}

	@bindThis
	public async init(params: JsonObject): Promise<boolean> {
		if (typeof params.spaceKey !== 'string') return false;
		if (!this.user) return false;

		this.spaceKey = params.spaceKey;

		try {
			await this.enter();
		} catch (err) {
			return false;
		}

		this.subscriber.on(`worldStream:${this.spaceKey}`, this.onEvent);

		return true;
	}

	@bindThis
	private async enter() {
		if (this.isEntered) return;

		await this.worldMultiplayService.enter(this.user!.id, this.spaceKey);

		this.isEntered = true;

		this.send('entered', {
			playerProfiles: await this.worldMultiplayService.getPlayerProfiles(this.spaceKey, this.user!.id),
		});

		this.intervalId = setInterval(async () => {
			const states = await this.worldMultiplayService.getPlayerStatesAndHeatbeat(this.user!.id, this.spaceKey);
			delete states[this.user!.id];
			this.send('sync', states);
		}, 100);
	}

	@bindThis
	private async onEvent(data: GlobalEvents['world']['payload']) {
		switch (data.type) {
			case 'enter': {
				if (data.body.user.id === this.user!.id) return; // 自分の入室は無視
				this.send('playerEntered', {
					id: data.body.user.id,
					profile: this.worldMultiplayService.packPlayerProfile(data.body.user, data.body.avatar),
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
				if (this.spaceKey != null && this.isEntered) {
					this.worldMultiplayService.updatePlayerState(this.user!.id, this.spaceKey, body);
				}
				break;
		}
	}

	@bindThis
	public dispose() {
		this.subscriber.off(`worldStream:${this.spaceKey}`, this.onEvent);

		clearInterval(this.intervalId);
		this.worldMultiplayService.left(this.user!.id, this.spaceKey);
	}
}
