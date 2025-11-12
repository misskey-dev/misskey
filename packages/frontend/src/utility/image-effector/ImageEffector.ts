/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { FXS } from './fxs.js';
import type { ImageCompositorFunction } from '@/lib/ImageCompositor.js';
import { ImageCompositor } from '@/lib/ImageCompositor.js';

export type ImageEffectorRGB = [r: number, g: number, b: number];

interface CommonParamDef {
	type: string;
	label?: string;
	caption?: string;
	default: unknown;
}

interface NumberParamDef extends CommonParamDef {
	type: 'number';
	default: number;
	min: number;
	max: number;
	step?: number;
	toViewValue?: (v: number) => string;
};

interface NumberEnumParamDef extends CommonParamDef {
	type: 'number:enum';
	enum: {
		value: number;
		label?: string;
		icon?: string;
	}[];
	default: number;
};

interface BooleanParamDef extends CommonParamDef {
	type: 'boolean';
	default: boolean;
};

interface AlignParamDef extends CommonParamDef {
	type: 'align';
	default: {
		x: 'left' | 'center' | 'right';
		y: 'top' | 'center' | 'bottom';
		margin?: number;
	};
};

interface SeedParamDef extends CommonParamDef {
	type: 'seed';
	default: number;
};

interface ColorParamDef extends CommonParamDef {
	type: 'color';
	default: ImageEffectorRGB;
};

type ImageEffectorFxParamDef = NumberParamDef | NumberEnumParamDef | BooleanParamDef | AlignParamDef | SeedParamDef | ColorParamDef;

export type ImageEffectorFxParamDefs = Record<string, ImageEffectorFxParamDef>;

export type ImageEffectorLayer = {
	[K in keyof typeof FXS]: {
		id: string;
		fxId: K;
		params: Parameters<(typeof FXS)[K]['fn']['main']>[0]['params'];
	};
}[keyof typeof FXS];

export type ImageEffectorUiDefinition<Fn extends ImageCompositorFunction<any> = ImageCompositorFunction> = {
	name: string;
	params: Fn extends ImageCompositorFunction<infer P> ? {
		[K in keyof P]: ImageEffectorFxParamDef;
	} : never;
};

type ImageEffectorImageCompositor = ImageCompositor<{
	[K in keyof typeof FXS]: typeof FXS[K]['fn'];
}>;

export class ImageEffector {
	private canvas: HTMLCanvasElement | null = null;
	private compositor: ImageEffectorImageCompositor;

	constructor(options: {
		canvas: HTMLCanvasElement;
		renderWidth: number;
		renderHeight: number;
		image: ImageData | ImageBitmap | HTMLImageElement | HTMLCanvasElement | null;
	}) {
		this.canvas = options.canvas;

		this.compositor = new ImageCompositor({
			canvas: this.canvas,
			renderWidth: options.renderWidth,
			renderHeight: options.renderHeight,
			image: options.image,
			functions: Object.fromEntries(Object.entries(FXS).map(([fxId, fx]) => [fxId, fx.fn])),
		});
	}

	public async render(layers: ImageEffectorLayer[]) {
		const compositorLayers: Parameters<ImageCompositor<any>['render']>[0] = [];

		for (const layer of layers) {
			compositorLayers.push({
				id: layer.id,
				functionId: layer.fxId,
				params: layer.params,
			});
		}

		this.compositor.render(compositorLayers as Parameters<ImageEffectorImageCompositor['render']>[0]);
	}

	public changeResolution(width: number, height: number) {
		this.compositor.changeResolution(width, height);
	}

	/*
	 * disposeCanvas = true だとloseContextを呼ぶため、コンストラクタで渡されたcanvasも再利用不可になるので注意
	 */
	public destroy(disposeCanvas = true) {
		this.compositor.destroy(disposeCanvas);
	}
}
