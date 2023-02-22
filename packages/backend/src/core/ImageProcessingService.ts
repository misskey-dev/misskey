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

export type IImageStreamable = IImage | IImageStream;

export const webpDefault: sharp.WebpOptions = {
	quality: 85,
	alphaQuality: 95,
	lossless: false,
	nearLossless: false,
	smartSubsample: true,
	mixed: true,
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
	 * Convert to JPEG
	 *   with resize, remove metadata, resolve orientation, stop animation
	 */
	@bindThis
	public async convertToJpeg(path: string, width: number, height: number): Promise<IImage> {
		return this.convertSharpToJpeg(await sharp(path), width, height);
	}

	@bindThis
	public async convertSharpToJpeg(sharp: sharp.Sharp, width: number, height: number): Promise<IImage> {
		const data = await sharp
			.resize(width, height, {
				fit: 'inside',
				withoutEnlargement: true,
			})
			.rotate()
			.jpeg({
				quality: 85,
				progressive: true,
			})
			.toBuffer();

		return {
			data,
			ext: 'jpg',
			type: 'image/jpeg',
		};
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
		const data = await sharp
			.resize(width, height, {
				fit: 'inside',
				withoutEnlargement: true,
			})
			.rotate()
			.webp(options)
			.toBuffer();

		return {
			data,
			ext: 'webp',
			type: 'image/webp',
		};
	}

	@bindThis
	public convertToWebpStream(path: string, width: number, height: number, options: sharp.WebpOptions = webpDefault): IImageStream {
		return this.convertSharpToWebpStream(sharp(path), width, height, options);
	}

	@bindThis
	public convertSharpToWebpStream(sharp: sharp.Sharp, width: number, height: number, options: sharp.WebpOptions = webpDefault): IImageStream {
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
	 * Convert to PNG
	 *   with resize, remove metadata, resolve orientation, stop animation
	 */
	@bindThis
	public async convertToPng(path: string, width: number, height: number): Promise<IImage> {
		return this.convertSharpToPng(await sharp(path), width, height);
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
