/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import { EventEmitter } from 'eventemitter3';
import * as Misskey from 'misskey-js';
import type { PlayerProfile, PlayerState } from 'misskey-world-engine/src/PlayerContainer.js';
import type { RoomController } from './controller.js';
import { useStream } from '@/stream.js';
import * as os from '@/os.js';
import { withTimeout } from '@/utility/promise-timeout.js';
import { deepEqual } from '@/utility/deep-equal.js';

export class Multiplayer {
	public isOnline = ref(false);
	private controller: RoomController;
	private connection: Misskey.IChannelConnection<Misskey.Channels['worldRoom']> | null = null;
	private roomId: string;
	private playerProfiles: Record<string, PlayerProfile> = {};

	constructor(roomId: string, controller: RoomController) {
		this.roomId = roomId;
		this.controller = controller;

		this.onSync = this.onSync.bind(this);
		this.onPlayerEntered = this.onPlayerEntered.bind(this);
		this.onPlayerLeft = this.onPlayerLeft.bind(this);
	}

	public enter() {
		const p = new Promise<void>((resolve, reject) => {
			this.connection = useStream().useChannel('worldRoom', {
				roomId: this.roomId,
			});
			this.connection.once('entered', ({ playerProfiles }) => {
				console.log('entered', playerProfiles);
				this.playerProfiles = playerProfiles;
				this.controller.updatePlayerProfiles(this.playerProfiles);
				this.connection!.on('sync', this.onSync);
				this.connection!.on('playerEntered', this.onPlayerEntered);
				this.connection!.on('playerLeft', this.onPlayerLeft);
				this.isOnline.value = true;
				resolve();
			});
		});

		return withTimeout(p, 5000).catch((err) => {
			this.connection?.dispose();
			this.connection = null;
			throw err;
		});
	}

	public left() {
		if (this.connection == null) return;
		this.connection.dispose();
		this.connection = null;
		this.isOnline.value = false;
	}

	private prevState: PlayerState | null = null;

	public updateState(state: PlayerState) {
		if (this.connection == null || !this.isOnline.value) return;
		if (this.prevState != null && deepEqual(this.prevState, state)) return;

		this.connection.send('update', state);
		this.prevState = state;
	}

	private onSync(states: Record<string, PlayerState>) {
		console.log('sync', states);
		this.controller.updatePlayerStates(states);
	}

	private onPlayerEntered(data: { id: string; profile: PlayerProfile; }) {
		this.playerProfiles[data.id] = data.profile;
		this.controller.updatePlayerProfiles(this.playerProfiles);
	}

	private onPlayerLeft(data: { id: string; }) {
		delete this.playerProfiles[data.id];
		this.controller.updatePlayerProfiles(this.playerProfiles);
	}

	public dispose() {
		this.left();
	}
}
