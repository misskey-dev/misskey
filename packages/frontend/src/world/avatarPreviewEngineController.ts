/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { EngineControllerBase } from './EngineControllerBase.js';
import type { AvatarPreviewEngine } from 'misskey-world-engine/src/avatarPreviewEngine.js';

export type AvatarPreviewEngineControllerOptions = {
	workerMode?: boolean;
	graphicsQuality: number;
	fps: number | null;
	resolution: number;
};

// 抽象化レイヤー
export class AvatarPreviewEngineController extends EngineControllerBase<AvatarPreviewEngine> {
	constructor(options: AvatarPreviewEngineControllerOptions) {
		super({
			...options,
			antialias: true,
		});
	}

	public async init(canvas: HTMLCanvasElement) {
		await this._init_(canvas, {
			createWorker: (offscreen) => new Promise((resolve) => {
				import('misskey-world-engine/src/avatarPreviewEngineWorker?worker').then(({ default: PreviewEngineWorker }) => {
					const worker = new PreviewEngineWorker();
					worker.postMessage({ type: 'init', canvas: offscreen, options: this.options }, [offscreen]);
					resolve(worker);
				});
			}),
			createEngine: () => new Promise((resolve) => {
				import('misskey-world-engine/src/avatarPreviewEngineNonWorker.js').then(({ createAvatarPreviewEngine }) => {
					const engine = createAvatarPreviewEngine({ canvas, options: this.options });
					resolve(engine);
				});
			}),
		});
	}

	public updateAvatarOption(key: string, value: any) {
		this.call('updateAvatarOption', [key, value]);
	}

	public loadAvatar(type: string) {
		return this.callAndWaitReturn('loadAvatar', [type]);
	}

	public clearAvatar() {
		this.call('clearAvatar');
	}
}
