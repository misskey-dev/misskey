/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import QRCodeStyling from 'qr-code-styling';
import { url, host } from '@@/js/config.js';
import { getProxiedImageUrl } from '../media-proxy.js';
import { ImageCompositor } from './ImageCompositor.js';
import type { ImageCompositorFunction, ImageCompositorLayer } from './ImageCompositor.js';
import { ensureSignin } from '@/i.js';

export type ImageEffectorRGB = [r: number, g: number, b: number];

type ParamTypeToPrimitive = {
	[K in ImageEffectorFxParamDef['type']]: (ImageEffectorFxParamDef & { type: K })['default'];
};

interface CommonParamDef {
	type: string;
	label?: string;
	caption?: string;
	default: any;
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

interface TextureParamDef extends CommonParamDef {
	type: 'texture';
	default: {
		type: 'text'; text: string | null;
	} | {
		type: 'url'; url: string | null;
	} | {
		type: 'qr'; data: string | null;
	} | null;
};

interface ColorParamDef extends CommonParamDef {
	type: 'color';
	default: ImageEffectorRGB;
};

type ImageEffectorFxParamDef = NumberParamDef | NumberEnumParamDef | BooleanParamDef | AlignParamDef | SeedParamDef | TextureParamDef | ColorParamDef;

export type ImageEffectorFxParamDefs = Record<string, ImageEffectorFxParamDef>;

export type GetParamType<T extends ImageEffectorFxParamDef> =
	T extends NumberEnumParamDef
		? T['enum'][number]['value']
		: ParamTypeToPrimitive[T['type']];

export type ParamsRecordTypeToDefRecord<PS extends ImageEffectorFxParamDefs> = {
	[K in keyof PS]: GetParamType<PS[K]>;
};

export type ImageEffectorFxDefinition<PS extends ImageEffectorFxParamDefs = ImageEffectorFxParamDefs> = {
	id: string;
	name: string;
	params: PS,
	shader: string;
	main: ImageCompositorFunction['main'];
};

export type ImageEffectorFx<PS extends ImageEffectorFxParamDefs = ImageEffectorFxParamDefs> = {
	id: string;
	name: string;
	fn: ImageCompositorFunction;
	params: PS,
};

export type ImageEffectorLayer = {
	id: string;
	fxId: string;
	params: ImageCompositorLayer['params'];
};

export function defineImageEffectorFx<PS extends ImageEffectorFxParamDefs>(fx: ImageEffectorFxDefinition<PS>): ImageEffectorFx<PS> {
	return {
		id: fx.id,
		name: fx.name,
		fn: {
			shader: fx.shader,
			main: fx.main,
		},
		params: fx.params,
	};
}

function getValue<T extends keyof ParamTypeToPrimitive>(params: Record<string, any>, k: string): ParamTypeToPrimitive[T] {
	return params[k];
}

export class ImageEffector {
	private canvas: HTMLCanvasElement | null = null;
	private fxs: ImageEffectorFx[];
	private compositor: ImageCompositor;

	constructor(options: {
		canvas: HTMLCanvasElement;
		renderWidth: number;
		renderHeight: number;
		image: ImageData | ImageBitmap | HTMLImageElement | HTMLCanvasElement | null;
		fxs: ImageEffectorFx[];
	}) {
		this.canvas = options.canvas;
		this.fxs = options.fxs;

		this.compositor = new ImageCompositor({
			canvas: this.canvas,
			renderWidth: options.renderWidth,
			renderHeight: options.renderHeight,
			image: options.image,
		});

		for (const fx of this.fxs) {
			this.compositor.registerFunction(fx.id, fx.fn);
		}
	}

	public async render(layers: ImageEffectorLayer[]) {
		const compositorLayers: ImageCompositorLayer[] = [];

		const unused = new Set(this.compositor.getKeysOfRegisteredTextures());

		for (const layer of layers) {
			const fx = this.fxs.find(fx => fx.id === layer.fxId);
			if (fx == null) continue;

			const fnParams: Record<string, any> = {};

			for (const k of Object.keys(layer.params)) {
				const paramDef = (fx.params as ImageEffectorFxParamDefs)[k];
				if (paramDef == null) continue;
				if (paramDef.type === 'texture') {
					const v = getValue<typeof paramDef.type>(layer.params, k);
					if (v == null) continue;

					const textureKey = this.getTextureKeyForParam(v);
					unused.delete(textureKey);
					fnParams[k] = textureKey;
					if (this.compositor.hasTexture(textureKey)) continue;

					if (_DEV_) console.log(`Baking texture of <${textureKey}>...`);

					const image =
					v.type === 'text' ? await createTextureFromText(v.text) :
					v.type === 'url' ? await createTextureFromUrl(v.url) :
					v.type === 'qr' ? await createTextureFromQr({ data: v.data }) :
					null;
					if (image == null) continue;

					this.compositor.registerTexture(textureKey, image);
				} else {
					fnParams[k] = layer.params[k];
				}
			}

			compositorLayers.push({
				id: layer.id,
				functionId: layer.fxId,
				params: fnParams,
			});
		}

		for (const k of unused) {
			if (_DEV_) console.log(`Dispose unused texture <${k}>...`);
			this.compositor.unregisterTexture(k);
		}

		this.compositor.render(compositorLayers);
	}

	public changeResolution(width: number, height: number) {
		this.compositor.changeResolution(width, height);
	}

	private getTextureKeyForParam(v: ParamTypeToPrimitive['texture']) {
		if (v == null) return '';
		return (
			v.type === 'text' ? `text:${v.text}` :
			v.type === 'url' ? `url:${v.url}` :
			v.type === 'qr' ? `qr:${v.data}` :
			''
		);
	}

	/*
	 * disposeCanvas = true だとloseContextを呼ぶため、コンストラクタで渡されたcanvasも再利用不可になるので注意
	 */
	public destroy(disposeCanvas = true) {
		this.compositor.destroy(disposeCanvas);
	}
}

async function createTextureFromUrl(imageUrl: string | null) {
	if (imageUrl == null || imageUrl.trim() === '') return null;

	const image = await new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = getProxiedImageUrl(imageUrl); // CORS対策
	}).catch(() => null);

	if (image == null) return null;

	return image;
}

async function createTextureFromText(text: string | null, resolution = 2048) {
	if (text == null || text.trim() === '') return null;

	const ctx = window.document.createElement('canvas').getContext('2d')!;
	ctx.canvas.width = resolution;
	ctx.canvas.height = resolution / 4;
	const fontSize = resolution / 32;
	const margin = fontSize / 2;
	ctx.shadowColor = '#000000';
	ctx.shadowBlur = fontSize / 4;

	//ctx.fillStyle = '#00ff00';
	//ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

	ctx.fillStyle = '#ffffff';
	ctx.font = `bold ${fontSize}px sans-serif`;
	ctx.textBaseline = 'middle';

	ctx.fillText(text, margin, ctx.canvas.height / 2);

	const textMetrics = ctx.measureText(text);
	const cropWidth = (Math.ceil(textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft) + margin + margin);
	const cropHeight = (Math.ceil(textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent) + margin + margin);
	const data = ctx.getImageData(0, (ctx.canvas.height / 2) - (cropHeight / 2), cropWidth, cropHeight);

	ctx.canvas.remove();

	return data;
}

async function createTextureFromQr(options: { data: string | null }, resolution = 512) {
	const $i = ensureSignin();

	const qrCodeInstance = new QRCodeStyling({
		width: resolution,
		height: resolution,
		margin: 42,
		type: 'canvas',
		data: options.data == null || options.data === '' ? `${url}/users/${$i.id}` : options.data,
		image: $i.avatarUrl,
		qrOptions: {
			typeNumber: 0,
			mode: 'Byte',
			errorCorrectionLevel: 'H',
		},
		imageOptions: {
			hideBackgroundDots: true,
			imageSize: 0.3,
			margin: 16,
			crossOrigin: 'anonymous',
		},
		dotsOptions: {
			type: 'dots',
		},
		cornersDotOptions: {
			type: 'dot',
		},
		cornersSquareOptions: {
			type: 'extra-rounded',
		},
	});

	const blob = await qrCodeInstance.getRawData('png') as Blob | null;
	if (blob == null) return null;

	const image = await window.createImageBitmap(blob);

	return image;
}
