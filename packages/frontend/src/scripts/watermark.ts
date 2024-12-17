/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import { getProxiedImageUrl } from "@/scripts/media-proxy.js";
import { misskeyApi } from "@/scripts/misskey-api.js";
import { defaultStore } from "@/store.js";

export const watermarkAnchor = [
	'top-left',
	'top',
	'top-right',
	'left',
	'center',
	'right',
	'bottom-left',
	'bottom',
	'bottom-right',
] as const;

export type WatermarkAnchor = typeof watermarkAnchor[number];

export type WatermarkConfig = {
	/** ドライブファイルのID */
	fileId?: string;
	/** 画像URL */
	fileUrl?: string;
	/** 親画像に対するウォーターマークの幅比率。ない場合は1。親画像が縦長の場合は幅の比率として、横長の場合は高さ比率として使用される */
	sizeRatio?: number;
	/** 透明度 */
	opacity?: number;
	/** 回転角度（度数） */
	rotate?: number;
	/** パディング */
	padding?: {
		top: number;
		right: number;
		bottom: number;
		left: number;
	};

	/** @internal */
	__bypassMediaProxy?: boolean;
} & ({
	/** 繰り返し */
	repeat?: false;
	/** 画像の始祖点 */
	anchor: WatermarkAnchor;
	/** 回転の際に領域を自動で拡張するかどうか */
	noBoundingBoxExpansion?: boolean;
} | {
	/** 繰り返し */
	repeat: true;
});

/**
 * プレビューに必要な値が全部揃っているかどうかを判定する
 */
export function canPreview(config: Partial<WatermarkConfig> | null): config is WatermarkConfig {
	return (
		config != null &&
		(config.fileUrl != null || config.fileId != null) &&
		((config.repeat !== true && 'anchor' in config && config.anchor != null) || (config.repeat === true))
	);
}

/**
 * ウォーターマークを適用してキャンバスに描画する
 *
 * @param img ウォーターマークを適用する画像（stringは画像URL）
 * @param el ウォーターマークを適用するキャンバス
 * @param config ウォーターマークの設定
 */
export async function applyWatermark(img: string | Blob, el: HTMLCanvasElement, config: WatermarkConfig | null) {
	const canvas = el;
	const ctx = canvas.getContext('2d')!;
	const imgEl = new Image();
	imgEl.onload = async () => {
		canvas.width = imgEl.width;
		canvas.height = imgEl.height;
		ctx.drawImage(imgEl, 0, 0);

		if (config != null) {
			if (config.fileUrl) {
				const watermark = new Image();
				watermark.onload = () => {
					const canvasAspectRatio = canvas.width / canvas.height; // 横長は1より大きい
					const watermarkAspectRatio = watermark.width / watermark.height; // 横長は1より大きい
					const { width, height } = (() => {
						const desiredWidth = canvas.width * (config.sizeRatio ?? 1);
						const desiredHeight = canvas.height * (config.sizeRatio ?? 1);

						if (
							(watermarkAspectRatio > 1 && canvasAspectRatio > 1) || // 両方横長
							(watermarkAspectRatio < 1 && canvasAspectRatio < 1) // 両方縦長
						) {
							// 横幅を基準にウォーターマークのサイズを決定
							return {
								width: desiredWidth,
								height: desiredWidth / watermarkAspectRatio,
							};
						} else {
							// 縦幅を基準にウォーターマークのサイズを決定
							return {
								width: desiredHeight * watermarkAspectRatio,
								height: desiredHeight,
							};
						}
					})();

					ctx.globalAlpha = config.opacity ?? 1;

					if (config.repeat) {
						// 余白をもたせた状態のウォーターマークを作成しておく（それをパターン繰り返しする）
						const resizedWatermark = document.createElement('canvas');
						resizedWatermark.width = width + (config.padding ? (config.padding.left ?? 0) + (config.padding.right ?? 0) : 0);
						resizedWatermark.height = height + (config.padding ? (config.padding.top ?? 0) + (config.padding.bottom ?? 0) : 0);
						const resizedCtx = resizedWatermark.getContext('2d')!;
						resizedCtx.drawImage(
							watermark,
							(config.padding ? config.padding.left ?? 0 : 0),
							(config.padding ? config.padding.top ?? 0 : 0),
							width,
							height
						);

						const pattern = ctx.createPattern(resizedWatermark, 'repeat');
						if (pattern) {
							ctx.fillStyle = pattern;
							if (config.rotate != null && config.rotate !== 0) {
								const rotateRad = config.rotate * Math.PI / 180;
								ctx.translate(canvas.width / 2, canvas.height / 2);
								ctx.rotate(rotateRad);
								ctx.translate(-canvas.width / 2, -canvas.height / 2);
								const rotatedWidth = Math.abs(canvas.width * Math.cos(rotateRad)) + Math.abs(canvas.height * Math.sin(rotateRad));
								const rotatedHeight = Math.abs(canvas.width * Math.sin(rotateRad)) + Math.abs(canvas.height * Math.cos(rotateRad));
								const x = Math.abs(rotatedWidth - canvas.width) / -2;
								const y = Math.abs(rotatedHeight - canvas.height) / -2;
								ctx.fillRect(x, y, rotatedWidth, rotatedHeight);
							} else {
								ctx.fillRect(0, 0, canvas.width, canvas.height);
							}
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
									return 0 + (config.padding ? config.padding.left ?? 0 : 0);
								case 'right':
								case 'top-right':
								case 'bottom-right':
									return canvas.width - width - (config.padding ? config.padding.right ?? 0 : 0);
							}
						})();

						const y = (() => {
							let rotateY = 0; // 回転によるY座標の補正

							if (config.rotate != null && config.rotate !== 0 && !config.noBoundingBoxExpansion) {
								const rotateRad = config.rotate * Math.PI / 180;
								rotateY = Math.abs(Math.abs(width * Math.sin(rotateRad)) + Math.abs(height * Math.cos(rotateRad)) - height) / 2;
							}

							switch (config.anchor) {
								case 'center':
								case 'left':
								case 'right':
									return (canvas.height - height) / 2;
								case 'top':
								case 'top-left':
								case 'top-right':
									return rotateY + (config.padding ? config.padding.top ?? 0 : 0);
								case 'bottom':
								case 'bottom-left':
								case 'bottom-right':
									return canvas.height - height - (config.padding ? config.padding.bottom ?? 0 : 0) - rotateY;
							}
						})();
						if (config.rotate) {
							const rotateRad = config.rotate * Math.PI / 180;
							ctx.translate(x + width / 2, y + height / 2);
							ctx.rotate(rotateRad);
							ctx.translate(-x - width / 2, -y - height / 2);
						}
						ctx.drawImage(watermark, x, y, width, height);
					}
				};

				let watermarkUrl: string;
				if (config.fileUrl == null && config.fileId != null) {
					const res = await misskeyApi('drive/files/show', { fileId: config.fileId });
					watermarkUrl = res.url;
					// 抜けてたら保存
					defaultStore.set('watermarkConfig', { ...config, fileUrl: watermarkUrl });
				} else {
					watermarkUrl = config.fileUrl!;
				}

				watermark.src = config.__bypassMediaProxy ? config.fileUrl : getProxiedImageUrl(watermarkUrl, undefined, true);
			}
		}
	};
	if (typeof img === 'string') {
		imgEl.src = img;
	} else {
		imgEl.src = URL.createObjectURL(img);
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
