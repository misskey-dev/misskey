import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';

export type IImage = {
	data: Buffer;
	ext: string | null;
	type: string;
};

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
	public async convertToJpeg(path: string, width: number, height: number): Promise<IImage> {
		return this.convertSharpToJpeg(await sharp(path), width, height);
	}

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
	public async convertToWebp(path: string, width: number, height: number, quality = 85): Promise<IImage> {
		return this.convertSharpToWebp(await sharp(path), width, height, quality);
	}

	public async convertSharpToWebp(sharp: sharp.Sharp, width: number, height: number, quality = 85): Promise<IImage> {
		const data = await sharp
			.resize(width, height, {
				fit: 'inside',
				withoutEnlargement: true,
			})
			.rotate()
			.webp({
				quality,
			})
			.toBuffer();

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
	public async convertToPng(path: string, width: number, height: number): Promise<IImage> {
		return this.convertSharpToPng(await sharp(path), width, height);
	}

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
