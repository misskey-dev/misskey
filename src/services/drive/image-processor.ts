import * as sharp from 'sharp';
import * as fs from 'fs';

export type IImage = {
	data: Buffer;
	ext: string | null;
	type: string;
};

/**
 * Convert to JPEG
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export async function convertToJpeg(path: string, width: number, height: number): Promise<IImage> {
	const data = await sharp(path)
		.resize(width, height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.rotate()
		.jpeg({
			quality: 85,
			progressive: true
		})
		.toBuffer();

	return {
		data,
		ext: 'jpg',
		type: 'image/jpeg'
	};
}

/**
 * Convert to WebP
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export async function convertToWebp(path: string, width: number, height: number): Promise<IImage> {
	const data = await sharp(path)
		.resize(width, height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.rotate()
		.webp({
			quality: 85
		})
		.toBuffer();

	return {
		data,
		ext: 'webp',
		type: 'image/webp'
	};
}

/**
 * Convert to PNG
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export async function convertToPng(path: string, width: number, height: number): Promise<IImage> {
	const data = await sharp(path)
		.resize(width, height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.rotate()
		.png()
		.toBuffer();

	return {
		data,
		ext: 'png',
		type: 'image/png'
	};
}

/**
 * Convert to GIF (Actually just NOP)
 */
export async function convertToGif(path: string): Promise<IImage> {
	const data = await fs.promises.readFile(path);

	return {
		data,
		ext: 'gif',
		type: 'image/gif'
	};
}

/**
 * Convert to APNG (Actually just NOP)
 */
export async function convertToApng(path: string): Promise<IImage> {
	const data = await fs.promises.readFile(path);

	return {
		data,
		ext: 'apng',
		type: 'image/apng'
	};
}
