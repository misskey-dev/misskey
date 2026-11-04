/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import * as zlib from 'node:zlib';
import { describe, expect, test } from 'vitest';
import sharp from 'sharp';
import { genIdenticon } from '@/misc/gen-identicon.js';

const size = 128;
const n = 5;
const margin = 34;
const cellSize = (size - (margin * 2)) / n;

const seeds = [
	'',
	'carol@example.com',
	'alice@example.com',
	'bob@example.com',
	'ユーザー@例え.jp',
	...Array.from({ length: 20 }, (_, i) => `user${i}@example.com`),
];

async function decode(png: Buffer) {
	const { data, info } = await sharp(png, { failOn: 'warning' }).raw().toBuffer({ resolveWithObject: true });
	expect(info.width).toBe(size);
	expect(info.height).toBe(size);
	expect(info.channels).toBe(3);

	const isWhite = (x: number, y: number) => {
		const offset = ((y * size) + x) * 3;
		return data[offset] === 0xff && data[offset + 1] === 0xff && data[offset + 2] === 0xff;
	};

	return { data, isWhite };
}

function parseChunks(png: Buffer) {
	const chunks: { type: string; data: Buffer }[] = [];
	let offset = 8;
	while (offset < png.length) {
		const length = png.readUInt32BE(offset);
		const type = png.toString('ascii', offset + 4, offset + 8);
		const data = png.subarray(offset + 8, offset + 8 + length);
		const crc = png.readUInt32BE(offset + 8 + length);
		expect(crc, `CRC of ${type}`).toBe(zlib.crc32(png.subarray(offset + 4, offset + 8 + length)));
		chunks.push({ type, data });
		offset += 12 + length;
	}
	expect(offset).toBe(png.length);
	return chunks;
}

describe(genIdenticon, () => {
	test('有効なPNGを生成する', async () => {
		const png = genIdenticon('carol@example.com');

		expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));

		const chunks = parseChunks(png);
		expect(chunks.map(c => c.type)).toEqual(['IHDR', 'PLTE', 'IDAT', 'IEND']);
		const ihdr = chunks[0].data;
		expect(ihdr.readUInt32BE(0)).toBe(size);
		expect(ihdr.readUInt32BE(4)).toBe(size);
		expect(ihdr[8]).toBe(8); // bit depth
		expect(ihdr[9]).toBe(3); // color type: indexed-color
		expect(chunks[1].data.length).toBe(256 * 3); // 256色のパレット

		const metadata = await sharp(png, { failOn: 'warning' }).metadata();
		expect(metadata.format).toBe('png');
		expect(metadata.width).toBe(size);
		expect(metadata.height).toBe(size);
	});

	test('同じseedからは同じ画像を生成する', () => {
		for (const seed of seeds) {
			expect(genIdenticon(seed)).toEqual(genIdenticon(seed));
		}
	});

	test('異なるseedからは異なる画像を生成する', async () => {
		const hashes = new Set<string>();
		for (const seed of seeds) {
			const { data } = await decode(genIdenticon(seed));
			hashes.add(createHash('sha256').update(data).digest('hex'));
		}
		expect(hashes.size).toBe(seeds.length);
	});

	test('余白にはセルが描画されない', async () => {
		for (const seed of seeds) {
			const { isWhite } = await decode(genIdenticon(seed));
			for (let y = 0; y < size; y++) {
				for (let x = 0; x < size; x++) {
					const inside = x >= margin && x < size - margin && y >= margin && y < size - margin;
					if (!inside) expect(isWhite(x, y), `seed: ${seed}, (${x}, ${y})`).toBe(false);
				}
			}
		}
	});

	test('各セルは継ぎ目なく単色で塗られ、左右対称になる', async () => {
		for (const seed of seeds) {
			const { isWhite } = await decode(genIdenticon(seed));
			const cells: boolean[][] = [];
			for (let cx = 0; cx < n; cx++) {
				cells[cx] = [];
				for (let cy = 0; cy < n; cy++) {
					const filled = isWhite(margin + (cellSize * cx), margin + (cellSize * cy));
					for (let y = margin + (cellSize * cy); y < margin + (cellSize * (cy + 1)); y++) {
						for (let x = margin + (cellSize * cx); x < margin + (cellSize * (cx + 1)); x++) {
							expect(isWhite(x, y), `seed: ${seed}, (${x}, ${y})`).toBe(filled);
						}
					}
					cells[cx][cy] = filled;
				}
			}
			for (let cx = 0; cx < n; cx++) {
				expect(cells[cx], `seed: ${seed}, column ${cx}`).toEqual(cells[n - 1 - cx]);
			}
		}
	});

	// identiconはアバターとして使われるため、意図せず見た目が変わらないようにする
	// (圧縮後のバイト列はzlibの実装によって変わりうるため、デコード後のピクセルで比較する)
	test.each([
		['carol@example.com', '4b6010bffe237109c0814c3303a3b9b23ca0d61f6d8b8c1613775988b5eb86bf'],
		['alice@example.com', '49aa5dd99926d6ad367a95e257668d50eda6de4df3aaa680fd1bcd903eaba00e'],
	])('%s のピクセルが変化しない', async (seed, expected) => {
		const { data } = await decode(genIdenticon(seed));
		expect(createHash('sha256').update(data).digest('hex')).toBe(expected);
	});
});
