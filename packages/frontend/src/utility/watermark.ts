/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FX_watermarkPlacement } from './image-effector/fxs/watermarkPlacement.js';
import { FX_stripe } from './image-effector/fxs/stripe.js';
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
	} | {
		id: string;
		type: 'stripe';
		angle: number;
		frequency: number;
		threshold: number;
		black: boolean;
		opacity: number;
	})[];
};

export class WatermarkRenderer {
	private effector: ImageEffector;
	private layers: WatermarkPreset['layers'] = [];

	constructor(options: {
		canvas: HTMLCanvasElement,
		renderWidth: number,
		renderHeight: number,
		image: HTMLImageElement | ImageBitmap,
	}) {
		this.effector = new ImageEffector({
			canvas: options.canvas,
			renderWidth: options.renderWidth,
			renderHeight: options.renderHeight,
			image: options.image,
			fxs: [FX_watermarkPlacement, FX_stripe],
		});
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
						watermark: {
							type: 'text',
							text: layer.text,
						},
					},
				};
			} else if (layer.type === 'image') {
				return {
					fxId: 'watermarkPlacement',
					id: layer.id,
					params: {
						repeat: layer.repeat,
						scale: layer.scale,
						align: layer.align,
						opacity: layer.opacity,
						cover: layer.cover,
						watermark: {
							type: 'url',
							url: layer.imageUrl,
						},
					},
				};
			} else if (layer.type === 'stripe') {
				return {
					fxId: 'stripe',
					id: layer.id,
					params: {
						angle: layer.angle,
						frequency: layer.frequency,
						threshold: layer.threshold,
						black: layer.black,
						opacity: layer.opacity,
					},
				};
			}
		});
	}

	public async setLayers(layers: WatermarkPreset['layers']) {
		this.layers = layers;
		await this.effector.setLayers(this.makeImageEffectorLayers());
		this.render();
	}

	public render(): void {
		this.effector.render();
	}

	/*
	 * disposeCanvas = true だとloseContextを呼ぶため、コンストラクタで渡されたcanvasも再利用不可になるので注意
	 */
	public destroy(disposeCanvas = true): void {
		this.effector.destroy(disposeCanvas);
	}
}
