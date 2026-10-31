/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { checkSvg, detectType, getFileSize } from '../../src/file/file-type.js';
import { fixMime } from '../../src/common/mime.js';
import { createPatternPng, createSvg, createTempDir } from '../utils.js';

/**
 * file-type が video/mp4 と判定する最小限の ftyp ボックス
 */
function createMp4Header(): Buffer {
	const box = Buffer.alloc(24);
	box.writeUInt32BE(24, 0);
	box.write('ftyp', 4, 'ascii');
	box.write('isom', 8, 'ascii');
	box.writeUInt32BE(0x200, 12);
	box.write('isomiso2', 16, 'ascii');
	return box;
}

describe('file-type', () => {
	let dir: string;
	let cleanup: () => Promise<void>;

	beforeAll(async () => {
		const temp = await createTempDir();
		dir = temp.dir;
		cleanup = temp.cleanup;
	});

	afterAll(async () => {
		await cleanup();
	});

	async function write(name: string, data: Buffer | string): Promise<string> {
		const filePath = path.join(dir, name);
		await fs.promises.writeFile(filePath, data);
		return filePath;
	}

	describe(detectType, () => {
		test('画像の形式を判定する', async () => {
			expect(await detectType(await write('a.png', await createPatternPng(8, 8)))).toEqual({ mime: 'image/png', ext: 'png' });
		});

		test('SVG を判定する', async () => {
			expect(await detectType(await write('a.svg', createSvg(8, 8)))).toEqual({ mime: 'image/svg+xml', ext: 'svg' });
		});

		test('XML 宣言付きの SVG を判定する', async () => {
			const svg = `<?xml version="1.0" encoding="UTF-8"?>\n${createSvg(8, 8).toString()}`;
			expect(await detectType(await write('b.svg', svg))).toEqual({ mime: 'image/svg+xml', ext: 'svg' });
		});

		test('0 バイトのファイルは application/octet-stream', async () => {
			expect(await detectType(await write('empty', ''))).toEqual({ mime: 'application/octet-stream', ext: null });
		});

		test('形式が不明なファイルは application/octet-stream', async () => {
			expect(await detectType(await write('a.txt', 'dummy text'))).toEqual({ mime: 'application/octet-stream', ext: null });
		});

		test('hasVideoTrack を省略した場合は動画として判定する', async () => {
			expect(await detectType(await write('a.mp4', createMp4Header()))).toEqual({ mime: 'video/mp4', ext: 'mp4' });
		});

		test('映像トラックがない動画は音声として判定する', async () => {
			const filePath = await write('b.mp4', createMp4Header());
			expect(await detectType(filePath, { hasVideoTrack: async () => false })).toEqual({ mime: 'audio/mp4', ext: 'm4a' });
			expect(await detectType(filePath, { hasVideoTrack: async () => true })).toEqual({ mime: 'video/mp4', ext: 'mp4' });
		});
	});

	describe(checkSvg, () => {
		test('1MB を超えるファイルは SVG として扱わない', async () => {
			const large = `${createSvg(8, 8).toString()}${' '.repeat(1024 * 1024)}`;
			expect(await checkSvg(await write('large.svg', large))).toBe(false);
		});

		test('存在しないファイルは false', async () => {
			expect(await checkSvg(path.join(dir, 'not-found.svg'))).toBe(false);
		});
	});

	describe(getFileSize, () => {
		test('ファイルサイズを返す', async () => {
			expect(await getFileSize(await write('size.txt', '12345'))).toBe(5);
		});
	});

	describe(fixMime, () => {
		test('古い MIME タイプを修正する', () => {
			expect(fixMime('audio/x-flac')).toBe('audio/flac');
			expect(fixMime('audio/vnd.wave')).toBe('audio/wav');
			expect(fixMime('image/png')).toBe('image/png');
		});
	});
});
