/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FX_watermarkPlacement } from './image-effector/fxs/watermarkPlacement.js';
import { createTextureFromText, createTextureFromUrl } from './image-effector/utilts.js';
import type { ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';
import { ImageEffector } from '@/utility/image-effector/ImageEffector.js';

export type WatermarkPreset = {
	id: string;
	name: string;
	layers: ({
		id: string;
		type: 'text';
		text: string;
		repeat: boolean;
		scale: number;
		align: { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom' };
		opacity: number;
	} | {
		id: string;
		type: 'image';
		imageUrl: string | null;
		imageId: string | null;
		cover: boolean;
		repeat: boolean;
		scale: number;
		align: { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom' };
		opacity: number;
	})[];
};

export class WatermarkRenderer {
	private effector: ImageEffector;
	private layers: WatermarkPreset['layers'] = [];
	private texturesKey = '';

	constructor(options: {
		canvas: HTMLCanvasElement,
		renderWidth: number,
		renderHeight: number,
		image: HTMLImageElement,
	}) {
		this.effector = new ImageEffector({
			canvas: options.canvas,
			renderWidth: options.renderWidth,
			renderHeight: options.renderHeight,
			image: options.image,
			fxs: [FX_watermarkPlacement],
		});
	}

	private calcTexturesKey() {
		return this.layers.map(layer => {
			if (layer.type === 'image' && layer.imageUrl != null) {
				return layer.imageUrl;
			} else if (layer.type === 'text' && layer.text != null) {
				return layer.text;
			}
			return '';
		}).join(';');
	}

	private async bakeTextures(): Promise<void> {
		this.effector.disposeExternalTextures();
		for (const layer of this.layers) {
			if (layer.type === 'text' && layer.text != null) {
				const { texture, width, height } = await createTextureFromText(this.effector.gl, layer.text);
				this.effector.registerExternalTexture(layer.id, texture, width, height);
			} else if (layer.type === 'image' && layer.imageUrl != null) {
				const { texture, width, height } = await createTextureFromUrl(this.effector.gl, layer.imageUrl);
				this.effector.registerExternalTexture(layer.id, texture, width, height);
			}
		}
	}

	private makeImageEffectorLayers(): ImageEffectorLayer[] {
		return this.layers.map(layer => {
			if (layer.type === 'text') {
				return {
					fxId: 'watermarkPlacement',
					id: layer.id,
					params: {
						repeat: layer.repeat,
						scale: layer.scale,
						align: layer.align,
						opacity: layer.opacity,
						cover: false,
					},
					textures: { watermark: layer.id },
				};
			} else {
				return {
					fxId: 'watermarkPlacement',
					id: layer.id,
					params: {
						repeat: layer.repeat,
						scale: layer.scale,
						align: layer.align,
						opacity: layer.opacity,
						cover: layer.cover,
					},
					textures: { watermark: layer.id },
				};
			}
		});
	}

	public async setLayers(layers: WatermarkPreset['layers']) {
		this.layers = layers;

		const newTexturesKey = this.calcTexturesKey();
		if (newTexturesKey !== this.texturesKey) {
			this.texturesKey = newTexturesKey;
			await this.bakeTextures();
		}

		this.effector.setLayers(this.makeImageEffectorLayers());

		this.render();
	}

	public render(): void {
		this.effector.render();
	}

	public destroy(): void {
		this.effector.destroy();
	}
}
