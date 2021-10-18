import * as sharp from 'sharp';
import { Readable } from 'stream';

export type IReadableImage = {
	readable: Readable;
	ext: string | null;
	type: string;
};

/**
 * Convert to JPEG
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export function convertToJpeg(readable: Readable, width: number, height: number): IReadableImage {
	const process = sharp()
		.resize(width, height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.rotate()
		.jpeg({
			quality: 85,
			progressive: true
		});

	return {
		readable: readable.pipe(process),
		ext: 'jpg',
		type: 'image/jpeg'
	};
}

/**
 * Convert to WebP
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export function convertToWebp(readable: Readable, width: number, height: number): IReadableImage {
	const process = sharp()
		.resize(width, height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.rotate()
		.webp({
			quality: 85
		});

	return {
		readable: readable.pipe(process),
		ext: 'webp',
		type: 'image/webp'
	};
}

/**
 * Convert to PNG
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export function convertToPng(readable: Readable, width: number, height: number): IReadableImage {
	const process = sharp()
		.resize(width, height, {
			fit: 'inside',
			withoutEnlargement: true
		})
		.rotate()
		.png();

	return {
		readable: readable.pipe(process),
		ext: 'png',
		type: 'image/png'
	};
}

/**
 * Convert to PNG or JPEG
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export async function convertToPngOrJpeg(readable: Readable, width: number, height: number): Promise<IReadableImage> {
	const sh = readable.pipe(sharp());
	const [ stats, metadata ] = await Promise.all([sh.stats(), sh.metadata()]);

	// 不透明で300x300pxの範囲を超えていればJPEG
	if (stats.isOpaque && ((metadata.width && metadata.width >= 300) || (metadata.height && metadata!.height >= 300))) {
		return convertToJpeg(sh, width, height);
	} else {
		return convertToPng(sh, width, height);
	}
}
