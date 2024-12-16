/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getProxiedImageUrl } from "@/scripts/media-proxy.js";
import { misskeyApi } from "@/scripts/misskey-api.js";

export type WatermarkConfig = {
	fileId?: string;
	fileUrl?: string;
	width?: number;
	height?: number;
	enlargement: 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';
	gravity: 'auto' | 'left' | 'right' | 'top' | 'bottom';
	opacity?: number;
	repeat: true | false | 'x' | 'y';
	anchor: 'center' | 'top' | 'left' | 'bottom' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
	offsetTop?: number;
	offsetLeft?: number;
	offsetBottom?: number;
	offsetRight?: number;
	backgroundColor?: string;
	rotate?: number;

	/** @internal */
	__bypassMediaProxy?: boolean;
};

/**
 * ウォーターマークを適用してキャンバスに描画する
 *
 * @param img ウォーターマークを適用する画像（stringは画像URL）
 * @param el ウォーターマークを適用するキャンバス
 * @param config ウォーターマークの設定
 */
export async function applyWatermark(img: string | Blob, el: HTMLCanvasElement, config: WatermarkConfig) {
	const canvas = el;
	const ctx = canvas.getContext('2d')!;
	const imgEl = new Image();
	imgEl.onload = async () => {
		canvas.width = imgEl.width;
		canvas.height = imgEl.height;
		ctx.drawImage(imgEl, 0, 0);
		if (config.fileUrl) {
			const watermark = new Image();
			watermark.onload = () => {
				const width = config.width || watermark.width;
				const height = config.height || watermark.height;
				ctx.globalAlpha = config.opacity ?? 1;
				if (config.repeat !== false) {
					const resizedWatermark = document.createElement('canvas');
					resizedWatermark.width = width;
					resizedWatermark.height = height;
					const resizedCtx = resizedWatermark.getContext('2d')!;
					resizedCtx.drawImage(watermark, 0, 0, width, height);
					const pattern = ctx.createPattern(resizedWatermark, config.repeat === true ? 'repeat' : `repeat-${config.repeat}`);
					if (pattern) {
						ctx.fillStyle = pattern;
						ctx.fillRect(0, 0, canvas.width, canvas.height);
					}
				} else {
					const x = (() => {
						switch (config.anchor) {
							case 'center':
							case 'top':
							case 'bottom':
								return (canvas.width - width) / 2;
							case 'left':
							case 'top-left':
							case 'bottom-left':
								return 0;
							case 'right':
							case 'top-right':
							case 'bottom-right':
								return canvas.width - width;
						}
					})();
					const y = (() => {
						switch (config.anchor) {
							case 'center':
							case 'left':
							case 'right':
								return (canvas.height - height) / 2;
							case 'top':
							case 'top-left':
							case 'top-right':
								return 0;
							case 'bottom':
							case 'bottom-left':
							case 'bottom-right':
								return canvas.height - height;
						}
					})();
					ctx.drawImage(watermark, x, y, width, height);
				}
			};

			let watermarkUrl: string;
			if (config.fileUrl == null && config.fileId != null) {
				const res = await misskeyApi('drive/files/show', { fileId: config.fileId });
				watermarkUrl = res.url;
			} else {
				watermarkUrl = config.fileUrl!;
			}

			watermark.src = config.__bypassMediaProxy ? config.fileUrl : getProxiedImageUrl(watermarkUrl, undefined, true);
		}
	};
	if (typeof img === 'string') {
		imgEl.src = img;
	} else {
		const reader = new FileReader();
		reader.onload = () => {
			imgEl.src = reader.result as string;
		};
		reader.readAsDataURL(img);
	}
}

/**
 * ウォーターマークを適用した画像をBlobとして取得する
 *
 * @param img ウォーターマークを適用する画像
 * @param config ウォーターマークの設定
 * @returns ウォーターマークを適用した画像のBlob
 */
export function getWatermarkAppliedImage(img: Blob, config: WatermarkConfig): Promise<Blob> {
	const canvas = document.createElement('canvas');
	applyWatermark(img, canvas, config);
	return new Promise<Blob>(resolve => {
		canvas.toBlob(blob => {
			resolve(blob!);
		});
	});
}
