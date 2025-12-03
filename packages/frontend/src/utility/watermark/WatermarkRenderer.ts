/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import QRCodeStyling from 'qr-code-styling';
import { url, host } from '@@/js/config.js';
import { getProxiedImageUrl } from '../media-proxy.js';
import { fn as fn_watermark } from './watermark.js';
import { fn as fn_stripe } from '@/utility/image-compositor-functions/stripe.js';
import { fn as fn_poladot } from '@/utility/image-compositor-functions/polkadot.js';
import { fn as fn_checker } from '@/utility/image-compositor-functions/checker.js';
import { ImageCompositor } from '@/lib/ImageCompositor.js';
import { ensureSignin } from '@/i.js';

type Align = { x: 'left' | 'center' | 'right'; y: 'top' | 'center' | 'bottom'; margin?: number; };

export type WatermarkLayers = ({
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

export type WatermarkPreset = {
	id: string;
	name: string;
	layers: WatermarkLayers;
};

type WatermarkRendererImageCompositor = ImageCompositor<{
	watermark: typeof fn_watermark;
	stripe: typeof fn_stripe;
	polkadot: typeof fn_poladot;
	checker: typeof fn_checker;
}>;

export class WatermarkRenderer {
	private compositor: WatermarkRendererImageCompositor;

	constructor(options: {
		canvas: HTMLCanvasElement,
		renderWidth: number,
		renderHeight: number,
		image: HTMLImageElement | ImageBitmap,
	}) {
		this.compositor = new ImageCompositor({
			canvas: options.canvas,
			renderWidth: options.renderWidth,
			renderHeight: options.renderHeight,
			image: options.image,
			functions: {
				watermark: fn_watermark,
				stripe: fn_stripe,
				polkadot: fn_poladot,
				checker: fn_checker,
			},
		});
	}

	public async render(layers: WatermarkLayers) {
		const compositorLayers: Parameters<WatermarkRendererImageCompositor['render']>[0] = [];

		const unused = new Set(this.compositor.getKeysOfRegisteredTextures());

		for (const layer of layers) {
			if (layer.type === 'text') {
				const textureKey = `text:${layer.text}`;
				unused.delete(textureKey);
				if (!this.compositor.hasTexture(textureKey)) {
					if (_DEV_) console.log(`Baking text texture of <${textureKey}>...`);
					const image = await createTextureFromText(layer.text);
					if (image != null) this.compositor.registerTexture(textureKey, image);
				}

				compositorLayers.push({
					functionId: 'watermark',
					id: layer.id,
					params: {
						repeat: layer.repeat,
						noBoundingBoxExpansion: layer.noBoundingBoxExpansion,
						scale: layer.scale,
						align: layer.align,
						angle: layer.angle,
						opacity: layer.opacity,
						cover: false,
						watermark: textureKey,
					},
				});
			} else if (layer.type === 'image') {
				const textureKey = `url:${layer.imageUrl}`;
				unused.delete(textureKey);
				if (!this.compositor.hasTexture(textureKey)) {
					if (_DEV_) console.log(`Baking url image texture of <${textureKey}>...`);
					const image = await createTextureFromUrl(layer.imageUrl);
					if (image != null) this.compositor.registerTexture(textureKey, image);
				}

				compositorLayers.push({
					functionId: 'watermark',
					id: layer.id,
					params: {
						repeat: layer.repeat,
						noBoundingBoxExpansion: layer.noBoundingBoxExpansion,
						scale: layer.scale,
						align: layer.align,
						angle: layer.angle,
						opacity: layer.opacity,
						cover: layer.cover,
						watermark: textureKey,
					},
				});
			} else if (layer.type === 'qr') {
				const textureKey = `qr:${layer.data}`;
				unused.delete(textureKey);
				if (!this.compositor.hasTexture(textureKey)) {
					if (_DEV_) console.log(`Baking qr texture of <${textureKey}>...`);
					const image = await createTextureFromQr({ data: layer.data });
					if (image != null) this.compositor.registerTexture(textureKey, image);
				}

				compositorLayers.push({
					functionId: 'watermark',
					id: layer.id,
					params: {
						repeat: false,
						scale: layer.scale,
						align: layer.align,
						angle: 0,
						opacity: layer.opacity,
						cover: false,
						watermark: textureKey,
					},
				});
			} else if (layer.type === 'stripe') {
				compositorLayers.push({
					functionId: 'stripe',
					id: layer.id,
					params: {
						angle: layer.angle,
						frequency: layer.frequency,
						threshold: layer.threshold,
						color: layer.color,
						opacity: layer.opacity,
					},
				});
			} else if (layer.type === 'polkadot') {
				compositorLayers.push({
					functionId: 'polkadot',
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
				});
			} else if (layer.type === 'checker') {
				compositorLayers.push({
					functionId: 'checker',
					id: layer.id,
					params: {
						angle: layer.angle,
						scale: layer.scale,
						color: layer.color,
						opacity: layer.opacity,
					},
				});
			} else {
				// @ts-expect-error Should be unreachable
				throw new Error(`Unrecognized layer type: ${layer.type}`);
			}
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

	/*
	 * disposeCanvas = true だとloseContextを呼ぶため、コンストラクタで渡されたcanvasも再利用不可になるので注意
	 */
	public destroy(disposeCanvas = true): void {
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
