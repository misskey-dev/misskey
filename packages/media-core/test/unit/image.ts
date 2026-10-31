/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { convertSharpToPng, convertToAvif, convertToWebp, convertToWebpStream } from '../../src/image/image.js';
import { getBlurhash } from '../../src/image/blurhash.js';
import { calcHash } from '../../src/file/hash.js';
import { detectImageSize } from '../../src/file/image-size.js';
import { createPatternPng, createTempDir } from '../utils.js';

describe('image', () => {
	let cleanup: () => Promise<void>;
	let pngPath: string;
	let pngBuffer: Buffer;

	beforeAll(async () => {
		const temp = await createTempDir();
		cleanup = temp.cleanup;
		pngBuffer = await createPatternPng(1000, 800);
		pngPath = path.join(temp.dir, 'image.png');
		await fs.promises.writeFile(pngPath, pngBuffer);
	});

	afterAll(async () => {
		await cleanup();
	});

	test('WebP に変換し、指定サイズに収める', async () => {
		const image = await convertToWebp(pngPath, 500, 500);
		const metadata = await sharp(image.data).metadata();

		expect(image.type).toBe('image/webp');
		expect(image.ext).toBe('webp');
		expect(metadata.format).toBe('webp');
		expect(metadata.width).toBe(500);
		expect(metadata.height).toBe(400);
	});

	test('WebP のストリームに変換する', async () => {
		const image = convertToWebpStream(pngPath, 100, 100);
		const metadata = await sharp(await image.data.toBuffer()).metadata();

		expect(image.type).toBe('image/webp');
		expect(metadata.width).toBe(100);
		expect(metadata.height).toBe(80);
	});

	test('元画像より拡大しない', async () => {
		const image = await convertToWebp(pngPath, 4000, 4000);
		const metadata = await sharp(image.data).metadata();

		expect(metadata.width).toBe(1000);
		expect(metadata.height).toBe(800);
	});

	test('AVIF に変換する', async () => {
		const image = await convertToAvif(pngPath, 200, 200);
		const metadata = await sharp(image.data).metadata();

		expect(image.type).toBe('image/avif');
		expect(image.ext).toBe('avif');
		expect(metadata.format).toBe('heif');
		expect(metadata.width).toBe(200);
	});

	test('PNG に変換する', async () => {
		const image = await convertSharpToPng(sharp(pngPath), 200, 200);
		const metadata = await sharp(image.data).metadata();

		expect(image.type).toBe('image/png');
		expect(metadata.format).toBe('png');
		expect(metadata.width).toBe(200);
		expect(metadata.height).toBe(160);
	});

	test('blurhash を計算する', async () => {
		const hash = await getBlurhash(pngPath, 'image/png');

		// 5x5 成分の blurhash は 1 (成分数) + 1 (最大 AC 値) + 4 (DC 成分) + 2 * (5 * 5 - 1) (AC 成分) = 54 文字
		expect(hash).toHaveLength(54);
	});

	test('画像サイズを判定する', async () => {
		const size = await detectImageSize(pngPath);

		expect(size.width).toBe(1000);
		expect(size.height).toBe(800);
		expect(size.wUnits).toBe('px');
	});

	test('MD5 ハッシュを計算する', async () => {
		const expected = (await import('node:crypto')).createHash('md5').update(pngBuffer).digest('hex');

		expect(await calcHash(pngPath)).toBe(expected);
	});
});
