/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { reactive, ref, shallowRef, triggerRef, watch } from 'vue';
import { EventEmitter } from 'eventemitter3';
import * as Misskey from 'misskey-js';
import type { PlayerState } from 'misskey-world-engine/src/PlayerContainer.js';
import { useStream } from '@/stream.js';
import * as os from '@/os.js';
import { withTimeout } from '@/utility/promise-timeout.js';
import { deepEqual } from '@/utility/deep-equal.js';

export class Multiplayer {
	public isOnline = ref(false);
	private connection: Misskey.IChannelConnection<Misskey.Channels['worldRoom']> | null = null;
	private roomId: string;

	constructor(roomId: string) {
		this.roomId = roomId;

		this.onSync = this.onSync.bind(this);
	}

	public enter() {
		const p = new Promise<void>((resolve, reject) => {
			this.connection = useStream().useChannel('worldRoom', {
				roomId: this.roomId,
			});
			this.connection.once('entered', () => {
				this.connection!.on('sync', this.onSync);
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

	public leave() {
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
	}

	public dispose() {
		this.leave();
	}
}
