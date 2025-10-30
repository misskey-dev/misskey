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
	labelScale: number;
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

		const paddingTop = Math.floor(imageAreaH * params.frameThickness);
		const paddingLeft = Math.floor(imageAreaH * params.frameThickness);
		const paddingRight = Math.floor(imageAreaH * params.frameThickness);
		const paddingBottom = Math.floor(imageAreaH * params.labelThickness);
		const renderWidth = imageAreaW + paddingLeft + paddingRight;
		const renderHeight = imageAreaH + paddingTop + paddingBottom;

		const aspectRatio = renderWidth / renderHeight;
		const labelCanvasCtx = window.document.createElement('canvas').getContext('2d')!;
		labelCanvasCtx.canvas.width = renderWidth;
		labelCanvasCtx.canvas.height = paddingBottom;
		const scaleBase = imageAreaH * params.labelScale;
		const fontSize = scaleBase / 30;
		const textsMarginLeft = Math.max(fontSize * 2, paddingLeft);
		const textsMarginRight = textsMarginLeft;
		const withQrCode = params.withQrCode;
		const qrSize = scaleBase * 0.1;
		const qrMarginRight = Math.max((labelCanvasCtx.canvas.height - qrSize) / 2, paddingRight);

		labelCanvasCtx.fillStyle = '#ffffff';
		labelCanvasCtx.fillRect(0, 0, labelCanvasCtx.canvas.width, labelCanvasCtx.canvas.height);

		labelCanvasCtx.fillStyle = '#000000';
		labelCanvasCtx.font = `bold ${fontSize}px sans-serif`;
		labelCanvasCtx.textBaseline = 'middle';

		const titleY = params.text === '' ? (labelCanvasCtx.canvas.height / 2) : (labelCanvasCtx.canvas.height / 2) - (fontSize * 0.9);
		if (params.centered) {
			labelCanvasCtx.textAlign = 'center';
			labelCanvasCtx.fillText(this.interpolateText(params.title), labelCanvasCtx.canvas.width / 2, titleY, labelCanvasCtx.canvas.width - textsMarginLeft - textsMarginRight);
		} else {
			labelCanvasCtx.textAlign = 'left';
			labelCanvasCtx.fillText(this.interpolateText(params.title), textsMarginLeft, titleY, labelCanvasCtx.canvas.width - textsMarginLeft - (withQrCode ? (qrSize + qrMarginRight + (fontSize * 1)) : textsMarginRight));
		}

		labelCanvasCtx.fillStyle = '#00000088';
		labelCanvasCtx.font = `${fontSize * 0.85}px sans-serif`;
		labelCanvasCtx.textBaseline = 'middle';

		const textY = params.title === '' ? (labelCanvasCtx.canvas.height / 2) : (labelCanvasCtx.canvas.height / 2) + (fontSize * 0.9);
		if (params.centered) {
			labelCanvasCtx.textAlign = 'center';
			labelCanvasCtx.fillText(this.interpolateText(params.text), labelCanvasCtx.canvas.width / 2, textY, labelCanvasCtx.canvas.width - textsMarginLeft - textsMarginRight);
		} else {
			labelCanvasCtx.textAlign = 'left';
			labelCanvasCtx.fillText(this.interpolateText(params.text), textsMarginLeft, textY, labelCanvasCtx.canvas.width - textsMarginLeft - (withQrCode ? (qrSize + qrMarginRight + (fontSize * 1)) : textsMarginRight));
		}

		const $i = ensureSignin();

		if (withQrCode) {
			try {
				const qrCodeInstance = new QRCodeStyling({
					width: labelCanvasCtx.canvas.height,
					height: labelCanvasCtx.canvas.height,
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

				labelCanvasCtx.drawImage(
					qrImageBitmap,
					labelCanvasCtx.canvas.width - qrSize - qrMarginRight,
					(labelCanvasCtx.canvas.height - qrSize) / 2,
					qrSize,
					qrSize,
				);
				qrImageBitmap.close();
			} catch (err) {
				// nop
			}
		}

		const data = labelCanvasCtx.getImageData(0, 0, labelCanvasCtx.canvas.width, labelCanvasCtx.canvas.height);

		await this.effector.registerTexture('label', data);

		this.effector.changeResolution(renderWidth, renderHeight);

		await this.effector.setLayers([{
			fxId: 'label',
			id: 'a',
			params: {
				image: 'image',
				label: 'label',
				paddingLeft: paddingLeft / renderWidth,
				paddingRight: paddingRight / renderWidth,
				paddingTop: paddingTop / renderHeight,
				paddingBottom: paddingBottom / renderHeight,
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
