/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import sharp from 'sharp';
import type { Readable } from 'node:stream';
import type { Sharp, WebpOptions } from 'sharp';

export type IImage = {
	data: Buffer;
	ext: string | null;
	type: string;
};

export type IImageStream = {
	data: Readable;
	ext: string | null;
	type: string;
};

export type IImageSharp = {
	data: Sharp;
	ext: string | null;
	type: string;
};

export type IImageStreamable = IImage | IImageStream | IImageSharp;

export const webpDefault: WebpOptions = {
	quality: 77,
	alphaQuality: 95,
	lossless: false,
	nearLossless: false,
	smartSubsample: true,
	mixed: true,
	effort: 2,
	loop: 0,
};

/**
 * Convert to WebP
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export function convertToWebpStream(path: string, width: number, height: number, options: WebpOptions = webpDefault): IImageSharp {
	return convertSharpToWebpStream(sharp(path), width, height, options);
}

export function convertSharpToWebpStream(sharp: Sharp, width: number, height: number, options: WebpOptions = webpDefault): IImageSharp {
	const data = sharp
		.resize(width, height, {
			fit: 'inside',
			withoutEnlargement: true,
		})
		.rotate()
		.webp(options);

	return {
		data,
		ext: 'webp',
		type: 'image/webp',
	};
}
