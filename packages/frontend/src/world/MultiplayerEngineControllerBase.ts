/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, shallowRef } from 'vue';
import { EngineControllerBase } from './EngineControllerBase.js';
import type { EngineControllerBaseOptions } from './EngineControllerBase.js';
import type { PlayerProfile, PlayerState } from 'misskey-world-engine/src/PlayerContainer.js';
import type { MultiplayEngineBase, MultiplayEngineBaseEvents } from 'misskey-world-engine/src/MultiplayEngineBase.js';
import type { Wasd } from './Wasd.js';

export type MultiplayerEngineControllerBaseOptions = EngineControllerBaseOptions & {
	showUsernameOnAvatar: boolean;
	show2dAvatarOnAvatar: boolean;
};

export abstract class MultiplayerEngineControllerBase<T extends MultiplayEngineBase<MultiplayEngineBaseEvents>, E> extends EngineControllerBase<T, E> {
	protected options: MultiplayerEngineControllerBaseOptions;

	constructor(options: MultiplayerEngineControllerBaseOptions, wasd?: Wasd) {
		super(options, wasd);
		this.options = options;
	}

	public myPlayerState = shallowRef<PlayerState>({
		position: [0, 0, 0],
		rotation: [0, 0, 0],
	});
	public isSitting = ref(false);

	public sit() {
		this.call('sit');
	}

	public lyingDown() {
		this.call('lyingDown');
	}

	public standUp() {
		this.call('standUp');
	}

	public updatePlayerProfiles(profiles: Record<string, PlayerProfile>) {
		this.call('updatePlayerProfiles', [profiles]);
	}

	public updatePlayerStates(states: Record<string, PlayerState>) {
		this.call('updatePlayerStates', [states]);
	}

	public clearPlayers() {
		this.call('clearPlayers');
	}

	public updateAvatarDisplayOptions(options: { showUsername: boolean; show2dAvatar: boolean }) {
		this.call('updateAvatarDisplayOptions', [options]);
	}
}
