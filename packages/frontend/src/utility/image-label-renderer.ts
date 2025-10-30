/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import QRCodeStyling from 'qr-code-styling';
import { url } from '@@/js/config.js';
import ExifReader from 'exifreader';
import { FX_label } from './image-effector/fxs/label.js';
import type { ImageEffectorFx, ImageEffectorLayer } from '@/utility/image-effector/ImageEffector.js';
import { ImageEffector } from '@/utility/image-effector/ImageEffector.js';
import { ensureSignin } from '@/i.js';

const FXS = [
	FX_label,
] as const satisfies ImageEffectorFx<string, any>[];

export type ImageLabelParams = {
	style: 'frame' | 'frameLess';
	frameThickness: number;
	labelThickness: number;
	title: string;
	text: string;
	centered: boolean;
	withQrCode: boolean;
};

export class ImageLabelRenderer {
	private effector: ImageEffector<typeof FXS>;
	private image: HTMLImageElement | ImageBitmap;
	private exif: ExifReader.Tags;
	private renderAsPreview = false;

	constructor(options: {
		canvas: HTMLCanvasElement,
		image: HTMLImageElement | ImageBitmap,
		exif: ExifReader.Tags,
		renderAsPreview?: boolean,
	}) {
		this.image = options.image;
		this.exif = options.exif;
		this.renderAsPreview = options.renderAsPreview ?? false;
		console.log(this.exif);

		this.effector = new ImageEffector({
			canvas: options.canvas,
			renderWidth: 1,
			renderHeight: 1,
			image: null,
			fxs: FXS,
		});

		this.effector.registerTexture('image', this.image);
	}

	private interpolateText(text: string) {
		return text.replaceAll(/\{(\w+)\}/g, (_: string, key: string) => {
			const meta_date = this.exif.DateTimeOriginal ? this.exif.DateTimeOriginal.description : '-';
			const date = meta_date.split(' ')[0].replaceAll(':', '/');
			switch (key) {
				case 'date': return date;
				case 'model': return this.exif.Model ? this.exif.Model.description : '-';
				case 'lensModel': return this.exif.LensModel ? this.exif.LensModel.description : '-';
				case 'mm': return this.exif.FocalLength ? this.exif.FocalLength.description.replace(' mm', '').replace('mm', '') : '-';
				case 'f': return this.exif.FNumber ? this.exif.FNumber.description.replace('f/', '') : '-';
				case 's': return this.exif.ExposureTime ? this.exif.ExposureTime.description : '-';
				case 'iso': return this.exif.ISOSpeedRatings ? this.exif.ISOSpeedRatings.description : '-';
				default: return '-';
			}
		});
	}

	public async update(params: ImageLabelParams): Promise<void> {
		let imageAreaW = this.image.width;
		let imageAreaH = this.image.height;

		if (this.renderAsPreview) {
			const MAX_W = 1000;
			const MAX_H = 1000;

			if (imageAreaW > MAX_W || imageAreaH > MAX_H) {
				const scale = Math.min(MAX_W / imageAreaW, MAX_H / imageAreaH);
				imageAreaW = Math.floor(imageAreaW * scale);
				imageAreaH = Math.floor(imageAreaH * scale);
			}
		}

		const paddingBottom = Math.floor(imageAreaH * params.labelThickness);
		const renderWidth = imageAreaW;
		const renderHeight = imageAreaH + paddingBottom;

		const aspectRatio = renderWidth / renderHeight;
		const ctx = window.document.createElement('canvas').getContext('2d')!;
		ctx.canvas.width = renderWidth;
		ctx.canvas.height = paddingBottom;
		const fontSize = ctx.canvas.height / 6;
		const marginX = Math.max(fontSize * 2, (imageAreaW * params.frameThickness) / aspectRatio);
		const withQrCode = params.withQrCode;
		const qrSize = ctx.canvas.height * 0.6;
		const qrMarginX = Math.max((ctx.canvas.height - qrSize) / 2, (imageAreaW * params.frameThickness) / aspectRatio);

		ctx.fillStyle = '#ffffff';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		ctx.fillStyle = '#000000';
		ctx.font = `bold ${fontSize}px sans-serif`;
		ctx.textBaseline = 'middle';

		const titleY = params.text === '' ? (ctx.canvas.height / 2) : (ctx.canvas.height / 2) - (fontSize * 0.9);
		if (params.centered) {
			ctx.textAlign = 'center';
			ctx.fillText(this.interpolateText(params.title), ctx.canvas.width / 2, titleY, ctx.canvas.width - marginX - marginX);
		} else {
			ctx.textAlign = 'left';
			ctx.fillText(this.interpolateText(params.title), marginX, titleY, ctx.canvas.width - marginX - (withQrCode ? (qrSize + qrMarginX + (fontSize * 1)) : 0));
		}

		ctx.fillStyle = '#00000088';
		ctx.font = `${fontSize * 0.85}px sans-serif`;
		ctx.textBaseline = 'middle';

		const textY = params.title === '' ? (ctx.canvas.height / 2) : (ctx.canvas.height / 2) + (fontSize * 0.9);
		if (params.centered) {
			ctx.textAlign = 'center';
			ctx.fillText(this.interpolateText(params.text), ctx.canvas.width / 2, textY, ctx.canvas.width - marginX - marginX);
		} else {
			ctx.textAlign = 'left';
			ctx.fillText(this.interpolateText(params.text), marginX, textY, ctx.canvas.width - marginX - (withQrCode ? (qrSize + qrMarginX + (fontSize * 1)) : 0));
		}

		const $i = ensureSignin();

		if (withQrCode) {
			const qrCodeInstance = new QRCodeStyling({
				width: ctx.canvas.height,
				height: ctx.canvas.height,
				margin: 0,
				type: 'canvas',
				data: `${url}/users/${$i.id}`,
				//image: $i.avatarUrl,
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
					roundSize: false,
				},
				cornersDotOptions: {
					type: 'dot',
				},
				cornersSquareOptions: {
					type: 'extra-rounded',
				},
			});

			const blob = await qrCodeInstance.getRawData('png') as Blob | null;
			if (blob == null) throw new Error('Failed to generate QR code');

			const qrImageBitmap = await window.createImageBitmap(blob);

			ctx.drawImage(
				qrImageBitmap,
				ctx.canvas.width - qrSize - qrMarginX,
				(ctx.canvas.height - qrSize) / 2,
				qrSize,
				qrSize,
			);
			qrImageBitmap.close();
		}

		const data = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);

		const padding = params.frameThickness;
		const paddingX = padding / aspectRatio;
		const paddingY = padding;

		await this.effector.registerTexture('label', data);

		this.effector.changeResolution(renderWidth, renderHeight);

		await this.effector.setLayers([{
			fxId: 'label',
			id: 'a',
			params: {
				image: 'image',
				label: 'label',
				imageMarginX: paddingX,
				imageMarginY: paddingY,
			},
		}]);
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
