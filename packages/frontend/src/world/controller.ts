/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MultiplayerEngineControllerBase } from './MultiplayerEngineControllerBase.js';
import { Wasd } from './Wasd.js';
import type { WorldEngine } from 'misskey-world-engine/src/engine.js';

export type WorldEngineControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
	antialias: boolean;
	fov: number;
	useVirtualJoystick?: boolean;
	showUsernameOnAvatar: boolean;
	show2dAvatarOnAvatar: boolean;
};

// 抽象化レイヤー
export class WorldEngineController extends MultiplayerEngineControllerBase<WorldEngine, {
	'playerPointed': { playerId: string; };
}> {
	protected options: WorldEngineControllerOptions;

	constructor(options: WorldEngineControllerOptions) {
		super(options, new Wasd({
			setCameraMoveVector: (vec, dash) => {
				this.call('cameraMove', [vec, dash]);
			},
		}));
		this.options = options;
	}

	public async init(canvas: HTMLCanvasElement) {
		const { engineEvents } = await this._init_(canvas, {
			createWorker: (offscreen) => new Promise((resolve) => {
				import('frontend-misskey-world-engine/src/worker?worker').then(({ default: WorldWorker }) => {
					const worker = new WorldWorker();
					worker.postMessage({ type: 'init', canvas: offscreen, options: this.options }, [offscreen]);
					resolve(worker);
				});
			}),
			createEngine: () => new Promise((resolve) => {
				import('frontend-misskey-world-engine/src/nonWorker.js').then(({ createWorldEngine }) => {
					const engine = createWorldEngine({ canvas, options: this.options });
					resolve(engine);
				});
			}),
		});

		engineEvents.on('changeSittingState', ({ isSitting }) => {
			this.isSitting.value = isSitting;
		});

		engineEvents.on('changeMyPlayerState', (playerState) => {
			this.myPlayerState.value = playerState;
		});

		engineEvents.on('playerPointed', ({ playerId }) => {
			this.emit('playerPointed', { playerId });
		});
	}

	public async reset(canvas: HTMLCanvasElement, options?: WorldEngineControllerOptions | null) {
		this._reset_();
		if (options != null) this.options = options;
		this.myPlayerState.value = {
			position: [0, 0, 0],
			rotation: [0, 0, 0],
		};
		await this.init(canvas);
	}

	public setCameraJoystickMoveVector(vec: { x: number; y: number }) {
		this.call('cameraJoystickMove', [vec]);
	}
}
