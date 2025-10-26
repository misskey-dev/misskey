/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ImageEffectorFx, ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';
import { FX_watermarkPlacement } from '@/utility/image-effector/fxs/watermarkPlacement.js';
import { FX_stripe } from '@/utility/image-effector/fxs/stripe.js';
import { FX_polkadot } from '@/utility/image-effector/fxs/polkadot.js';
import { FX_checker } from '@/utility/image-effector/fxs/checker.js';
import { ImageEffector } from '@/utility/image-effector/ImageEffector.js';

const WATERMARK_FXS = [
	FX_watermarkPlacement,
	FX_stripe,
	FX_polkadot,
	FX_checker,
] as const satisfies ImageEffectorFx<string, any>[];

type Align = { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom'; margin?: number; };

export type WatermarkPreset = {
	id: string;
	name: string;
	layers: ({
		id: string;
		type: 'text';
		text: string;
		repeat: boolean;
		noBoundingBoxExpansion: boolean;
		scale: number;
		angle: number;
		align: Align;
		opacity: number;
	} | {
		id: string;
		type: 'image';
		imageUrl: string | null;
		imageId: string | null;
		cover: boolean;
		repeat: boolean;
		noBoundingBoxExpansion: boolean;
		scale: number;
		angle: number;
		align: Align;
		opacity: number;
	} | {
		id: string;
		type: 'qr';
		data: string;
		scale: number;
		align: Align;
		opacity: number;
	} | {
		id: string;
		type: 'stripe';
		angle: number;
		frequency: number;
		threshold: number;
		color: [r: number, g: number, b: number];
		opacity: number;
	} | {
		id: string;
		type: 'polkadot';
		angle: number;
		scale: number;
		majorRadius: number;
		majorOpacity: number;
		minorDivisions: number;
		minorRadius: number;
		minorOpacity: number;
		color: [r: number, g: number, b: number];
		opacity: number;
	} | {
		id: string;
		type: 'checker';
		angle: number;
		scale: number;
		color: [r: number, g: number, b: number];
		opacity: number;
	})[];
};

export class WatermarkRenderer {
	private effector: ImageEffector<typeof WATERMARK_FXS>;
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
			fxs: WATERMARK_FXS,
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
						noBoundingBoxExpansion: layer.noBoundingBoxExpansion,
						scale: layer.scale,
						align: layer.align,
						angle: layer.angle,
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
						noBoundingBoxExpansion: layer.noBoundingBoxExpansion,
						scale: layer.scale,
						align: layer.align,
						angle: layer.angle,
						opacity: layer.opacity,
						cover: layer.cover,
						watermark: {
							type: 'url',
							url: layer.imageUrl,
						},
					},
				};
			} else if (layer.type === 'qr') {
				return {
					fxId: 'watermarkPlacement',
					id: layer.id,
					params: {
						repeat: false,
						scale: layer.scale,
						align: layer.align,
						angle: 0,
						opacity: layer.opacity,
						cover: false,
						watermark: {
							type: 'qr',
							data: layer.data,
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
						color: layer.color,
						opacity: layer.opacity,
					},
				};
			} else if (layer.type === 'polkadot') {
				return {
					fxId: 'polkadot',
					id: layer.id,
					params: {
						angle: layer.angle,
						scale: layer.scale,
						majorRadius: layer.majorRadius,
						majorOpacity: layer.majorOpacity,
						minorDivisions: layer.minorDivisions,
						minorRadius: layer.minorRadius,
						minorOpacity: layer.minorOpacity,
						color: layer.color,
					},
				};
			} else if (layer.type === 'checker') {
				return {
					fxId: 'checker',
					id: layer.id,
					params: {
						angle: layer.angle,
						scale: layer.scale,
						color: layer.color,
						opacity: layer.opacity,
					},
				};
			} else {
				throw new Error(`Unrecognized layer type: ${(layer as any).type}`);
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
