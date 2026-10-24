/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import sharp from 'sharp';
import type { Readable } from 'node:stream';
import type { IImageStreamable } from '../src/image.js';

/**
 * テスト用のファイルを置く一時ディレクトリを作成する
 */
export async function createTempDir(): Promise<{ dir: string; cleanup: () => Promise<void> }> {
	const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'media-proxy-core-test-'));
	return {
		dir,
		cleanup: () => fs.promises.rm(dir, { recursive: true, force: true }),
	};
}

/**
 * 単色の PNG を作成する (エントロピーが低い画像)
 */
export function createFlatPng(width: number, height: number): Promise<Buffer> {
	return sharp({
		create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } },
	}).png().toBuffer();
}

/**
 * 模様のある PNG を作成する (エントロピーが十分にある画像)
 */
export function createPatternPng(width: number, height: number): Promise<Buffer> {
	const pixels = Buffer.alloc(width * height * 3);
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const i = (y * width + x) * 3;
			const v = ((x >> 3) + (y >> 3)) % 2 === 0 ? 255 : 0;
			pixels[i] = v;
			pixels[i + 1] = (x * 255 / width) | 0;
			pixels[i + 2] = (y * 255 / height) | 0;
		}
	}
	return sharp(pixels, { raw: { width, height, channels: 3 } }).png().toBuffer();
}

export function createSvg(width: number, height: number): Buffer {
	return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="#f00"/></svg>`, 'utf8');
}

/**
 * convertProxyImage などの結果をバッファに変換する
 */
export async function imageToBuffer(data: IImageStreamable['data']): Promise<Buffer> {
	if (Buffer.isBuffer(data)) return data;
	if ('toBuffer' in data && typeof data.toBuffer === 'function') return await data.toBuffer();

	const chunks: Buffer[] = [];
	for await (const chunk of data as Readable) {
		chunks.push(Buffer.from(chunk));
	}
	return Buffer.concat(chunks);
}
