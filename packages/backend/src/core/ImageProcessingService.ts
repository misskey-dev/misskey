/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';

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
	data: sharp.Sharp;
	ext: string | null;
	type: string;
};

export type IImageStreamable = IImage | IImageStream | IImageSharp;

export const webpDefault: sharp.WebpOptions = {
	quality: 77,
	alphaQuality: 95,
	lossless: false,
	nearLossless: false,
	smartSubsample: true,
	mixed: true,
	effort: 2,
};

export const avifDefault: sharp.AvifOptions = {
	quality: 60,
	lossless: false,
	effort: 2,
};

import { bindThis } from '@/decorators.js';
import { Readable } from 'node:stream';

@Injectable()
export class ImageProcessingService {
	constructor(
		@Inject(DI.config)
		private config: Config,
	) {
	}

	/**
	 * Convert to WebP
	 *   with resize, remove metadata, resolve orientation, stop animation
	 */
	@bindThis
	public async convertToWebp(path: string, width: number, height: number, options: sharp.WebpOptions = webpDefault): Promise<IImage> {
		return this.convertSharpToWebp(sharp(path), width, height, options);
	}

	@bindThis
	public async convertSharpToWebp(sharp: sharp.Sharp, width: number, height: number, options: sharp.WebpOptions = webpDefault): Promise<IImage> {
		const result = this.convertSharpToWebpStream(sharp, width, height, options);

		return {
			data: await result.data.toBuffer(),
			ext: result.ext,
			type: result.type,
		};
	}

	@bindThis
	public convertToWebpStream(path: string, width: number, height: number, options: sharp.WebpOptions = webpDefault): IImageSharp {
		return this.convertSharpToWebpStream(sharp(path), width, height, options);
	}

	@bindThis
	public convertSharpToWebpStream(sharp: sharp.Sharp, width: number, height: number, options: sharp.WebpOptions = webpDefault): IImageSharp {
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

	/**
	 * Convert to Avif
	 *   with resize, remove metadata, resolve orientation, stop animation
	 */
	@bindThis
	public async convertToAvif(path: string, width: number, height: number, options: sharp.AvifOptions = avifDefault): Promise<IImage> {
		return this.convertSharpToAvif(sharp(path), width, height, options);
	}

	@bindThis
	public async convertSharpToAvif(sharp: sharp.Sharp, width: number, height: number, options: sharp.AvifOptions = avifDefault): Promise<IImage> {
		const result = this.convertSharpToAvifStream(sharp, width, height, options);

		return {
			data: await result.data.toBuffer(),
			ext: result.ext,
			type: result.type,
		};
	}

	@bindThis
	public convertToAvifStream(path: string, width: number, height: number, options: sharp.AvifOptions = avifDefault): IImageSharp {
		return this.convertSharpToAvifStream(sharp(path), width, height, options);
	}

	@bindThis
	public convertSharpToAvifStream(sharp: sharp.Sharp, width: number, height: number, options: sharp.AvifOptions = avifDefault): IImageSharp {
		const data = sharp
			.resize(width, height, {
				fit: 'inside',
				withoutEnlargement: true,
			})
			.rotate()
			.avif(options);

		return {
			data,
			ext: 'avif',
			type: 'image/avif',
		};
	}

	/**
	 * Convert to PNG
	 *   with resize, remove metadata, resolve orientation, stop animation
	 */
	@bindThis
	public async convertToPng(path: string, width: number, height: number): Promise<IImage> {
		return this.convertSharpToPng(sharp(path), width, height);
	}

	@bindThis
	public async convertSharpToPng(sharp: sharp.Sharp, width: number, height: number): Promise<IImage> {
		const data = await sharp
			.resize(width, height, {
				fit: 'inside',
				withoutEnlargement: true,
			})
			.rotate()
			.png()
			.toBuffer();

		return {
			data,
			ext: 'png',
			type: 'image/png',
		};
	}
}
