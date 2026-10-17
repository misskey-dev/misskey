/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { convertProxyImage } from '../../src/proxy-image.js';
import { StatusError } from '../../src/status-error.js';
import { createFlatPng, createPatternPng, createSvg, createTempDir, imageToBuffer } from '../utils.js';
import type { ProxyQuery } from '../../src/proxy-request.js';
import type { ProxySourceFile } from '../../src/proxy-image.js';

describe(convertProxyImage, () => {
	let cleanup: () => Promise<void>;
	let largePng: ProxySourceFile;
	let smallPng: ProxySourceFile;
	let flatPng: ProxySourceFile;
	let largeSvg: ProxySourceFile;
	let text: ProxySourceFile;

	beforeAll(async () => {
		const temp = await createTempDir();
		cleanup = temp.cleanup;

		const write = async (name: string, data: Buffer, mime: string, ext: string | null): Promise<ProxySourceFile> => {
			const filePath = path.join(temp.dir, name);
			await fs.promises.writeFile(filePath, data);
			return { path: filePath, mime, ext };
		};

		largePng = await write('large.png', await createPatternPng(1000, 800), 'image/png', 'png');
		smallPng = await write('small.png', await createPatternPng(64, 48), 'image/png', 'png');
		flatPng = await write('flat.png', await createFlatPng(100, 100), 'image/png', 'png');
		largeSvg = await write('large.svg', createSvg(4000, 1000), 'image/svg+xml', 'svg');
		text = await write('text.txt', Buffer.from('dummy text', 'utf8'), 'text/plain', 'txt');
	});

	afterAll(async () => {
		await cleanup();
	});

	async function convert(file: ProxySourceFile, query: ProxyQuery) {
		const image = await convertProxyImage(file, query);
		if (image == null) throw new Error('image is null');
		const metadata = await sharp(await imageToBuffer(image.data)).metadata();
		return { image, metadata };
	}

	async function getStatusCode(promise: Promise<unknown>): Promise<number | null> {
		try {
			await promise;
		} catch (e) {
			if (e instanceof StatusError) return e.statusCode;
			throw e;
		}
		return null;
	}

	describe('変換クエリなし', () => {
		test('ブラウザで表示できる画像はそのまま返すため null を返す', async () => {
			expect(await convertProxyImage(largePng, {})).toBeNull();
		});

		test('SVG は 2048x2048 以内の WebP に変換する', async () => {
			const { image, metadata } = await convert(largeSvg, {});

			expect(image.type).toBe('image/webp');
			expect(image.ext).toBe('webp');
			expect(metadata.format).toBe('webp');
			expect(metadata.width).toBe(2048);
			expect(metadata.height).toBe(512);
		});

		test('画像以外は 403', async () => {
			expect(await getStatusCode(convertProxyImage(text, {}))).toBe(403);
		});

		test('画像であってもブラウザで表示できない形式は 403', async () => {
			expect(await getStatusCode(convertProxyImage({ ...largePng, mime: 'image/vnd.adobe.photoshop' }, {}))).toBe(403);
		});

		test('ブラウザで表示できても画像以外は 403', async () => {
			expect(await getStatusCode(convertProxyImage({ ...largePng, mime: 'video/mp4' }, {}))).toBe(403);
		});
	});

	describe('変換クエリあり', () => {
		test.each<[string, ProxyQuery]>([
			['emoji', { emoji: '1' }],
			['avatar', { avatar: '1' }],
			['static', { static: '1' }],
			['preview', { preview: '1' }],
			['badge', { badge: '1' }],
		])('%s: 変換できない形式は 404', async (_, query) => {
			expect(await getStatusCode(convertProxyImage(text, query))).toBe(404);
		});

		test('emoji: 高さ 128px 以下の WebP', async () => {
			const { image, metadata } = await convert(largePng, { emoji: '1' });

			expect(image.type).toBe('image/webp');
			expect(metadata.format).toBe('webp');
			expect(metadata.height).toBe(128);
			expect(metadata.width).toBe(160);
		});

		test('emoji: 元画像より拡大しない', async () => {
			const { metadata } = await convert(smallPng, { emoji: '1' });

			expect(metadata.height).toBe(48);
		});

		test('emoji: APNG は無変換で返す', async () => {
			const apng = { ...largePng, mime: 'image/apng' };
			const image = await convertProxyImage(apng, { emoji: '1' });

			expect(image?.type).toBe('image/apng');
			expect(image?.ext).toBe('png');
			expect(await imageToBuffer(image!.data)).toEqual(await fs.promises.readFile(largePng.path));
		});

		test('emoji + static: APNG でも高さ 128px 以下の WebP に変換する', async () => {
			const { image, metadata } = await convert({ ...largePng, mime: 'image/apng' }, { emoji: '1', static: '1' });

			expect(image.type).toBe('image/webp');
			expect(metadata.height).toBe(128);
		});

		test('avatar: 高さ 320px 以下の WebP', async () => {
			const { image, metadata } = await convert(largePng, { avatar: '1' });

			expect(image.type).toBe('image/webp');
			expect(metadata.height).toBe(320);
			expect(metadata.width).toBe(400);
		});

		test('static: 498x422 に収まる WebP', async () => {
			const { image, metadata } = await convert(largePng, { static: '1' });

			expect(image.type).toBe('image/webp');
			expect(metadata.width).toBeLessThanOrEqual(498);
			expect(metadata.height).toBeLessThanOrEqual(422);
			expect(metadata.width === 498 || metadata.height === 422).toBe(true);
		});

		test('preview: 200x200 に収まる WebP', async () => {
			const { image, metadata } = await convert(largePng, { preview: '1' });

			expect(image.type).toBe('image/webp');
			expect(metadata.width).toBe(200);
			expect(metadata.height).toBe(160);
		});

		test('badge: 96x96 の PNG', async () => {
			const { image, metadata } = await convert(largePng, { badge: '1' });

			expect(image.type).toBe('image/png');
			expect(image.ext).toBe('png');
			expect(metadata.format).toBe('png');
			expect(metadata.width).toBe(96);
			expect(metadata.height).toBe(96);
		});

		test('badge: エントロピーの低い画像は 404', async () => {
			expect(await getStatusCode(convertProxyImage(flatPng, { badge: '1' }))).toBe(404);
		});
	});
});
