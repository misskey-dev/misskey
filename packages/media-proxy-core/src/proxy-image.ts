/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import sharp from 'sharp';
import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import { FILE_TYPE_BROWSERSAFE } from './const.js';
import { StatusError } from './status-error.js';
import { isMimeImage } from './mime.js';
import { convertSharpToWebpStream, convertToWebpStream, webpDefault } from './image.js';
import type { IImageStreamable } from './image.js';
import type { ProxyQuery } from './proxy-request.js';

export type ProxySourceFile = {
	path: string;
	mime: string;
	ext: string | null;
};

/**
 * クエリに応じて画像を変換する
 *
 * 変換が不要で元ファイルをそのまま返してよい場合は null を返す
 * （Range リクエストへの対応など、元ファイルの返し方は呼び出し側に任せる）
 */
export async function convertProxyImage(file: ProxySourceFile, query: ProxyQuery): Promise<IImageStreamable | null> {
	const requiresImageConversion = 'emoji' in query || 'avatar' in query || 'static' in query || 'preview' in query || 'badge' in query;
	const isConvertibleImage = isMimeImage(file.mime, 'sharp-convertible-image-with-bmp');
	if (requiresImageConversion && !isConvertibleImage) {
		throw new StatusError('Unexpected mime', 404);
	}

	if ('emoji' in query || 'avatar' in query) {
		return processEmojiOrAvatar(file, query);
	}

	if ('static' in query) {
		return convertSharpToWebpStream(await sharpBmp(file.path, file.mime), 498, 422);
	}

	if ('preview' in query) {
		return convertSharpToWebpStream(await sharpBmp(file.path, file.mime), 200, 200);
	}

	if ('badge' in query) {
		return processBadge(file);
	}

	if (file.mime === 'image/svg+xml') {
		return convertToWebpStream(file.path, 2048, 2048);
	}

	if (!file.mime.startsWith('image/') || !FILE_TYPE_BROWSERSAFE.includes(file.mime)) {
		throw new StatusError('Rejected type', 403, 'Rejected type');
	}

	return null;
}

/**
 * 絵文字またはアバター用の画像を処理する
 */
async function processEmojiOrAvatar(
	file: ProxySourceFile,
	query: Pick<ProxyQuery, 'emoji' | 'avatar' | 'static'>,
): Promise<IImageStreamable> {
	const isAnimationConvertibleImage = isMimeImage(file.mime, 'sharp-animation-convertible-image-with-bmp');
	if (!isAnimationConvertibleImage && !('static' in query)) {
		return {
			data: fs.createReadStream(file.path),
			ext: file.ext,
			type: file.mime,
		};
	}

	const data = (await sharpBmp(file.path, file.mime, { animated: !('static' in query) }))
		.resize({
			height: 'emoji' in query ? 128 : 320,
			withoutEnlargement: true,
		})
		.webp(webpDefault);

	return {
		data,
		ext: 'webp',
		type: 'image/webp',
	};
}

/**
 * バッジ用の画像を処理する
 */
async function processBadge(file: ProxySourceFile): Promise<IImageStreamable> {
	const mask = (await sharpBmp(file.path, file.mime))
		.resize(96, 96, {
			fit: 'contain',
			position: 'centre',
			withoutEnlargement: false,
		})
		.greyscale()
		.normalise()
		.linear(1.75, -(128 * 1.75) + 128) // 1.75x contrast
		.flatten({ background: '#000' })
		.toColorspace('b-w');

	const stats = await mask.clone().stats();

	if (stats.entropy < 0.1) {
		throw new StatusError('Skip to provide badge', 404);
	}

	const data = sharp({
		create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
	})
		.pipelineColorspace('b-w')
		.boolean(await mask.png().toBuffer(), 'eor');

	return {
		data: await data.png().toBuffer(),
		ext: 'png',
		type: 'image/png',
	};
}
