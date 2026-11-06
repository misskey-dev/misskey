/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import {
	avifDefault,
	convertSharpToAvif,
	convertSharpToAvifStream,
	convertSharpToPng,
	convertSharpToWebp,
	convertSharpToWebpStream,
	convertToAvif,
	convertToAvifStream,
	convertToPng,
	convertToWebp,
	convertToWebpStream,
	webpDefault,
} from '@misskey-dev/media-core';
import { bindThis } from '@/decorators.js';
import type { IImage, IImageSharp } from '@misskey-dev/media-core';
import type { Sharp, WebpOptions, AvifOptions } from 'sharp';

/**
 * 画像の変換処理 (実装は @misskey-dev/media-core)
 */
@Injectable()
export class ImageProcessingService {
	constructor(
	) {
	}

	/**
	 * Convert to WebP
	 *   with resize, remove metadata, resolve orientation, stop animation
	 */
	@bindThis
	public async convertToWebp(path: string, width: number, height: number, options: WebpOptions = webpDefault): Promise<IImage> {
		return convertToWebp(path, width, height, options);
	}

	@bindThis
	public async convertSharpToWebp(sharp: Sharp, width: number, height: number, options: WebpOptions = webpDefault): Promise<IImage> {
		return convertSharpToWebp(sharp, width, height, options);
	}

	@bindThis
	public convertToWebpStream(path: string, width: number, height: number, options: WebpOptions = webpDefault): IImageSharp {
		return convertToWebpStream(path, width, height, options);
	}

	@bindThis
	public convertSharpToWebpStream(sharp: Sharp, width: number, height: number, options: WebpOptions = webpDefault): IImageSharp {
		return convertSharpToWebpStream(sharp, width, height, options);
	}

	/**
	 * Convert to Avif
	 *   with resize, remove metadata, resolve orientation, stop animation
	 */
	@bindThis
	public async convertToAvif(path: string, width: number, height: number, options: AvifOptions = avifDefault): Promise<IImage> {
		return convertToAvif(path, width, height, options);
	}

	@bindThis
	public async convertSharpToAvif(sharp: Sharp, width: number, height: number, options: AvifOptions = avifDefault): Promise<IImage> {
		return convertSharpToAvif(sharp, width, height, options);
	}

	@bindThis
	public convertToAvifStream(path: string, width: number, height: number, options: AvifOptions = avifDefault): IImageSharp {
		return convertToAvifStream(path, width, height, options);
	}

	@bindThis
	public convertSharpToAvifStream(sharp: Sharp, width: number, height: number, options: AvifOptions = avifDefault): IImageSharp {
		return convertSharpToAvifStream(sharp, width, height, options);
	}

	/**
	 * Convert to PNG
	 *   with resize, remove metadata, resolve orientation, stop animation
	 */
	@bindThis
	public async convertToPng(path: string, width: number, height: number): Promise<IImage> {
		return convertToPng(path, width, height);
	}

	@bindThis
	public async convertSharpToPng(sharp: Sharp, width: number, height: number): Promise<IImage> {
		return convertSharpToPng(sharp, width, height);
	}
}
