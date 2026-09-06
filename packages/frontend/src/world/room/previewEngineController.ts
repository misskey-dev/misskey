/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EngineControllerBase } from '../EngineControllerBase.js';
import type { RoomFurniturePreviewEngine } from 'misskey-world-engine/src/room/previewEngine.js';
import type { RoomAttachments } from 'misskey-world/src/room/type.js';

export type PreviewEngineControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
};

// 抽象化レイヤー
export class PreviewEngineController extends EngineControllerBase<RoomFurniturePreviewEngine> {
	constructor(options: PreviewEngineControllerOptions) {
		super({
			...options,
			antialias: true,
		});
	}

	public async init(canvas: HTMLCanvasElement) {
		await this._init_(canvas, {
			createWorker: (offscreen) => new Promise((resolve) => {
				import('misskey-world-engine/src/room/previewEngineWorker?worker').then(({ default: PreviewEngineWorker }) => {
					const worker = new PreviewEngineWorker();
					worker.postMessage({ type: 'init', canvas: offscreen, options: this.options }, [offscreen]);
					resolve(worker);
				});
			}),
			createEngine: () => new Promise((resolve) => {
				import('misskey-world-engine/src/room/previewEngineNonWorker.js').then(({ createRoomPreviewEngine }) => {
					const engine = createRoomPreviewEngine({ canvas, options: this.options });
					resolve(engine);
				});
			}),
		});
	}

	public updateFurnitureOption(key: string, value: any, attachments?: RoomAttachments) {
		this.call('updateFurnitureOption', [key, value, attachments]);
	}

	public loadFurniture(type: string) {
		return this.callAndWaitReturn('loadFurniture', [type]);
	}

	public clearFurniture() {
		this.call('clearFurniture');
	}
}
