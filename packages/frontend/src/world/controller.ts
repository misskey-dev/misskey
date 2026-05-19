/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EngineControllerBase } from './EngineControllerBase.js';
import type { WorldEngine } from './engine.js';

export type WorldEngineControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
	antialias: boolean;
};

// 抽象化レイヤー
export class WorldEngineController extends EngineControllerBase<WorldEngine> {
	constructor(options: WorldEngineControllerOptions) {
		super({
			...options,
		});
	}

	public async init(canvas: HTMLCanvasElement) {
		/*
		await this._init_(canvas, {
			createWorker: (offscreen) => new Promise((resolve) => {
				import('./worker?worker').then(({ default: WorldEngineWorker }) => {
					const worker = new WorldEngineWorker();
					worker.postMessage({ type: 'init', canvas: offscreen, options: this.options }, [offscreen]);
					resolve(worker);
				});
			}),
			createEngine: (babylonEngine) => new Promise((resolve) => {
				import('./engine.js').then(({ WorldEngine }) => {
					resolve(new WorldEngine({
						engine: babylonEngine,
						...this.options,
					}));
				});
			}),
		});
		*/
	}
}
