/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EngineControllerBase } from '../EngineControllerBase.js';
import type { RoomObjectPreviewEngine } from './previewEngine.js';
import type { RoomAttachments } from './utility.js';

export type PreviewEngineControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
};

// 抽象化レイヤー
export class PreviewEngineController extends EngineControllerBase<RoomObjectPreviewEngine> {
	constructor(options: PreviewEngineControllerOptions) {
		super({
			...options,
			antialias: true,
		});
	}

	public async init(canvas: HTMLCanvasElement) {
		await this._init_(canvas, {
			createWorker: (offscreen) => new Promise((resolve) => {
				import('./previewEngineWorker?worker').then(({ default: PreviewEngineWorker }) => {
					const worker = new PreviewEngineWorker();
					worker.postMessage({ type: 'init', canvas: offscreen, options: this.options }, [offscreen]);
					resolve(worker);
				});
			}),
			createEngine: (babylonEngine) => new Promise((resolve) => {
				import('./previewEngine.js').then(({ RoomObjectPreviewEngine }) => {
					resolve(new RoomObjectPreviewEngine({
						engine: babylonEngine,
						...this.options,
					}));
				});
			}),
		});
	}

	public updateObjectOption(key: string, value: any, attachments?: RoomAttachments) {
		this.call('updateObjectOption', [key, value, attachments]);
	}

	public loadObject(type: string) {
		return this.callAndWaitReturn('loadObject', [type]);
	}

	public clearObject() {
		this.call('clearObject');
	}
}
