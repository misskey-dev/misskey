/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import QRCodeStyling from 'qr-code-styling';
import { url } from '@@/js/config.js';
import ExifReader from 'exifreader';
import { FN_frame } from './frame.js';
import { ImageCompositor } from '@/lib/ImageCompositor.js';
import { ensureSignin } from '@/i.js';

const $i = ensureSignin();

type LabelParams = {
	enabled: boolean;
	scale: number;
	padding: number;
	textBig: string;
	textSmall: string;
	centered: boolean;
	withQrCode: boolean;
};

export type ImageFrameParams = {
	borderThickness: number;
	labelTop: LabelParams;
	labelBottom: LabelParams;
	bgColor: [r: number, g: number, b: number];
	fgColor: [r: number, g: number, b: number];
	font: 'serif' | 'sans-serif';
	borderRadius: number; // TODO
};

export type ImageFramePreset = {
	id: string;
	name: string;
	params: ImageFrameParams;
};

export class ImageFrameRenderer {
	private compositor: ImageCompositor<{ frame: typeof FN_frame }>;
	private image: HTMLImageElement | ImageBitmap;
	private exif: ExifReader.Tags | null;
	private caption: string | null = null;
	private filename: string | null = null;
	private renderAsPreview = false;

	constructor(options: {
		canvas: HTMLCanvasElement,
		image: HTMLImageElement | ImageBitmap,
		exif: ExifReader.Tags | null,
		filename: string | null,
		caption: string | null,
		renderAsPreview?: boolean,
	}) {
		this.image = options.image;
		this.exif = options.exif;
		this.caption = options.caption ?? null;
		this.filename = options.filename ?? null;
		this.renderAsPreview = options.renderAsPreview ?? false;

		this.compositor = new ImageCompositor({
			canvas: options.canvas,
			renderWidth: 1,
			renderHeight: 1,
			image: null,
			functions: { frame: FN_frame },
		});

		this.compositor.registerTexture('image', this.image);
	}

	private interpolateTemplateText(text: string) {
		const DateTimeOriginal = this.exif == null ? '2012:03:04 5:06:07' : this.exif.DateTimeOriginal?.description;
		const Model = this.exif == null ? 'Example camera' : this.exif.Model?.description;
		const LensModel = this.exif == null ? 'Example lens 123mm f/1.23' : this.exif.LensModel?.description;
		const FocalLength = this.exif == null ? '123mm' : this.exif.FocalLength?.description;
		const FocalLengthIn35mmFilm = this.exif == null ? '123mm' : this.exif.FocalLengthIn35mmFilm?.description;
		const ExposureTime = this.exif == null ? '1/234' : this.exif.ExposureTime?.description;
		const FNumber = this.exif == null ? '1.23' : this.exif.FNumber?.description;
		const ISOSpeedRatings = this.exif == null ? '123' : this.exif.ISOSpeedRatings?.description;
		const GPSLatitude = this.exif == null ? '123.000000000000123' : this.exif.GPSLatitude?.description;
		const GPSLongitude = this.exif == null ? '456.000000000000123' : this.exif.GPSLongitude?.description;
		return text.replaceAll(/\{(\w+)\}/g, (_: string, key: string) => {
			const meta_date = DateTimeOriginal ?? '????:??:?? ??:??:??';
			const date = meta_date.split(' ')[0].replaceAll(':', '/');
			switch (key) {
				case 'caption': return this.caption ?? '?';
				case 'filename': return this.filename ?? '?';
				case 'filename_without_ext': return this.filename?.replace(/\.[^/.]+$/, '') ?? '?';
				case 'year': return date.split('/')[0];
				case 'month': return date.split('/')[1].replace(/^0/, '');
				case 'day': return date.split('/')[2].replace(/^0/, '');
				case 'hour': return meta_date.split(' ')[1].split(':')[0].replace(/^0/, '');
				case 'minute': return meta_date.split(' ')[1].split(':')[1].replace(/^0/, '');
				case 'second': return meta_date.split(' ')[1].split(':')[2].replace(/^0/, '');
				case '0month': return date.split('/')[1];
				case '0day': return date.split('/')[2];
				case '0hour': return meta_date.split(' ')[1].split(':')[0];
				case '0minute': return meta_date.split(' ')[1].split(':')[1];
				case '0second': return meta_date.split(' ')[1].split(':')[2];
				case 'camera_model': return Model ?? '?';
				case 'camera_lens_model': return LensModel ?? '?';
				case 'camera_mm': return FocalLength?.replace(' mm', '').replace('mm', '') ?? '?';
				case 'camera_mm_35': return FocalLengthIn35mmFilm?.replace(' mm', '').replace('mm', '') ?? '?';
				case 'camera_f': return FNumber?.replace('f/', '') ?? '?';
				case 'camera_s': return ExposureTime ?? '?';
				case 'camera_iso': return ISOSpeedRatings ?? '?';
				case 'gps_lat': return GPSLatitude ?? '?';
				case 'gps_long': return GPSLongitude ?? '?';
				default: return '?';
			}
		});
	}

	private async renderLabel(renderWidth: number, renderHeight: number, paddingLeft: number, paddingRight: number, imageAreaH: number, fgColor: [number, number, number], font: string, params: LabelParams) {
		const scaleBase = imageAreaH * params.scale;
		const labelCanvasCtx = window.document.createElement('canvas').getContext('2d')!;
		labelCanvasCtx.canvas.width = renderWidth;
		labelCanvasCtx.canvas.height = renderHeight;
		const fontSize = scaleBase / 30;
		const textsMarginLeft = Math.max(fontSize * 2, paddingLeft);
		const textsMarginRight = textsMarginLeft;
		const withQrCode = params.withQrCode;
		const qrSize = scaleBase * 0.1;
		const qrMarginRight = Math.max((labelCanvasCtx.canvas.height - qrSize) / 2, paddingRight);

		labelCanvasCtx.fillStyle = `rgb(${Math.floor(fgColor[0] * 255)}, ${Math.floor(fgColor[1] * 255)}, ${Math.floor(fgColor[2] * 255)})`;
		labelCanvasCtx.font = `bold ${fontSize}px ${font}`;
		labelCanvasCtx.textBaseline = 'middle';

		const titleY = params.textSmall === '' ? (labelCanvasCtx.canvas.height / 2) : (labelCanvasCtx.canvas.height / 2) - (fontSize * 0.9);
		if (params.centered) {
			labelCanvasCtx.textAlign = 'center';
			labelCanvasCtx.fillText(this.interpolateTemplateText(params.textBig), labelCanvasCtx.canvas.width / 2, titleY, labelCanvasCtx.canvas.width - textsMarginLeft - textsMarginRight);
		} else {
			labelCanvasCtx.textAlign = 'left';
			labelCanvasCtx.fillText(this.interpolateTemplateText(params.textBig), textsMarginLeft, titleY, labelCanvasCtx.canvas.width - textsMarginLeft - (withQrCode ? (qrSize + qrMarginRight + (fontSize * 1)) : textsMarginRight));
		}

		labelCanvasCtx.fillStyle = `rgba(${Math.floor(fgColor[0] * 255)}, ${Math.floor(fgColor[1] * 255)}, ${Math.floor(fgColor[2] * 255)}, 0.5)`;
		labelCanvasCtx.font = `${fontSize * 0.85}px ${font}`;
		labelCanvasCtx.textBaseline = 'middle';

		const textY = params.textBig === '' ? (labelCanvasCtx.canvas.height / 2) : (labelCanvasCtx.canvas.height / 2) + (fontSize * 0.9);
		if (params.centered) {
			labelCanvasCtx.textAlign = 'center';
			labelCanvasCtx.fillText(this.interpolateTemplateText(params.textSmall), labelCanvasCtx.canvas.width / 2, textY, labelCanvasCtx.canvas.width - textsMarginLeft - textsMarginRight);
		} else {
			labelCanvasCtx.textAlign = 'left';
			labelCanvasCtx.fillText(this.interpolateTemplateText(params.textSmall), textsMarginLeft, textY, labelCanvasCtx.canvas.width - textsMarginLeft - (withQrCode ? (qrSize + qrMarginRight + (fontSize * 1)) : textsMarginRight));
		}

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
						color: `rgb(${Math.floor(fgColor[0] * 255)}, ${Math.floor(fgColor[1] * 255)}, ${Math.floor(fgColor[2] * 255)})`,
					},
					backgroundOptions: {
						color: 'transparent',
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
			} catch (_) {
				// nop
			}
		}

		return labelCanvasCtx.getImageData(0, 0, labelCanvasCtx.canvas.width, labelCanvasCtx.canvas.height); ;
	}

	public async render(params: ImageFrameParams): Promise<void> {
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

		const paddingLeft = Math.floor(imageAreaH * params.borderThickness);
		const paddingRight = Math.floor(imageAreaH * params.borderThickness);
		const paddingTop = params.labelTop.enabled ? Math.floor(imageAreaH * params.labelTop.padding) : Math.floor(imageAreaH * params.borderThickness);
		const paddingBottom = params.labelBottom.enabled ? Math.floor(imageAreaH * params.labelBottom.padding) : Math.floor(imageAreaH * params.borderThickness);
		const renderWidth = imageAreaW + paddingLeft + paddingRight;
		const renderHeight = imageAreaH + paddingTop + paddingBottom;

		if (params.labelTop.enabled) {
			const topLabelImage = await this.renderLabel(renderWidth, paddingTop, paddingLeft, paddingRight, imageAreaH, params.fgColor, params.font, params.labelTop);
			this.compositor.registerTexture('topLabel', topLabelImage);
		}

		if (params.labelBottom.enabled) {
			const bottomLabelImage = await this.renderLabel(renderWidth, paddingBottom, paddingLeft, paddingRight, imageAreaH, params.fgColor, params.font, params.labelBottom);
			this.compositor.registerTexture('bottomLabel', bottomLabelImage);
		}

		this.compositor.changeResolution(renderWidth, renderHeight);

		this.compositor.render([{
			functionId: 'frame',
			id: 'a',
			params: {
				image: 'image',
				topLabel: 'topLabel',
				bottomLabel: 'bottomLabel',
				topLabelEnabled: params.labelTop.enabled,
				bottomLabelEnabled: params.labelBottom.enabled,
				paddingLeft: paddingLeft / renderWidth,
				paddingRight: paddingRight / renderWidth,
				paddingTop: paddingTop / renderHeight,
				paddingBottom: paddingBottom / renderHeight,
				bg: params.bgColor,
			},
		}]);
	}

	/*
	 * disposeCanvas = true だとloseContextを呼ぶため、コンストラクタで渡されたcanvasも再利用不可になるので注意
	 */
	public destroy(disposeCanvas = true): void {
		this.compositor.destroy(disposeCanvas);
	}
}
