/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Identicon generator
 * https://en.wikipedia.org/wiki/Identicon
 */

import * as zlib from 'node:zlib';
import gen from 'random-seed';

const size = 128; // px
const n = 5; // resolution
const margin = 34; // size - margin * 2 / 整数でないといけないので明示
const colors = [
	['#FF512F', '#DD2476'],
	['#FF61D2', '#FE9090'],
	['#72FFB6', '#10D164'],
	['#FD8451', '#FFBD6F'],
	['#305170', '#6DFC6B'],
	['#00C0FF', '#4218B8'],
	['#009245', '#FCEE21'],
	['#0100EC', '#FB36F4'],
	['#FDABDD', '#374A5A'],
	['#38A2D7', '#561139'],
	['#121C84', '#8278DA'],
	['#5761B2', '#1FC5A8'],
	['#FFDB01', '#0E197D'],
	['#FF3E9D', '#0E1F40'],
	['#766eff', '#00d4ff'],
	['#9bff6e', '#00d4ff'],
	['#ff6e94', '#00d4ff'],
	['#ffa96e', '#00d4ff'],
	['#ffa96e', '#ff009d'],
	['#ffdd6e', '#ff009d'],
];

const actualSize = size - (margin * 2);
const cellSize = actualSize / n;
const sideN = Math.floor(n / 2);

// 背景のグラデーションは x + y の値だけで決まるので、パレットの 0 〜 (size * 2 - 2) 番に
// x + y ごとの色を、末尾に白を割り当てたインデックスカラーで表現する
const gradientSteps = (size * 2) - 1;
const whiteIndex = gradientSteps;
const paletteSize = gradientSteps + 1; // 256色に収まる必要がある

// 各行の先頭にフィルタタイプの1バイトを持つ生データ
const stride = 1 + size;
const paethFilter = 4;

const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const pngHeader = Buffer.alloc(13);
pngHeader.writeUInt32BE(size, 0); // width
pngHeader.writeUInt32BE(size, 4); // height
pngHeader[8] = 8; // bit depth
pngHeader[9] = 3; // color type: indexed-color

function parseHexColor(color: string): [number, number, number] {
	return [
		parseInt(color.slice(1, 3), 16),
		parseInt(color.slice(3, 5), 16),
		parseInt(color.slice(5, 7), 16),
	];
}

function pngChunk(type: string, data: Buffer): Buffer {
	const chunk = Buffer.alloc(12 + data.length);
	chunk.writeUInt32BE(data.length, 0);
	chunk.write(type, 4, 'ascii');
	data.copy(chunk, 8);
	chunk.writeUInt32BE(zlib.crc32(chunk.subarray(4, 8 + data.length)), 8 + data.length);
	return chunk;
}

function paethPredictor(a: number, b: number, c: number): number {
	const p = a + b - c;
	const pa = Math.abs(p - a);
	const pb = Math.abs(p - b);
	const pc = Math.abs(p - c);
	if (pa <= pb && pa <= pc) return a;
	if (pb <= pc) return b;
	return c;
}

/**
 * Generate buffer of an identicon by seed
 */
export function genIdenticon(seed: string): Buffer {
	const rand = gen.create(seed);

	const [bgFrom, bgTo] = colors[rand(colors.length)].map(parseHexColor);

	// side bitmap (filled by false)
	const side: boolean[][] = new Array(sideN);
	for (let i = 0; i < side.length; i++) {
		side[i] = new Array(n).fill(false);
	}

	// 1*n (filled by false)
	const center: boolean[] = new Array(n).fill(false);

	// eslint:disable-next-line:prefer-for-of
	for (let x = 0; x < side.length; x++) {
		for (let y = 0; y < side[x].length; y++) {
			side[x][y] = rand(3) === 0;
		}
	}

	for (let i = 0; i < center.length; i++) {
		center[i] = rand(3) === 0;
	}

	// 左上から右下への線形グラデーション (ピクセル中心で評価)
	const palette = Buffer.alloc(paletteSize * 3, 0xff);
	for (let i = 0; i < gradientSteps; i++) {
		const t = (i + 1) / (size * 2);
		for (let c = 0; c < 3; c++) {
			palette[(i * 3) + c] = Math.round(bgFrom[c] + ((bgTo[c] - bgFrom[c]) * t));
		}
	}

	const pixels = Buffer.alloc(size * size);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			pixels[(y * size) + x] = x + y;
		}
	}

	// Draw
	for (let x = 0; x < n; x++) {
		for (let y = 0; y < n; y++) {
			const isXCenter = x === ((n - 1) / 2);
			if (isXCenter && !center[y]) continue;

			const isLeftSide = x < ((n - 1) / 2);
			if (isLeftSide && !side[x][y]) continue;

			const isRightSide = x > ((n - 1) / 2);
			if (isRightSide && !side[sideN - (x - sideN)][y]) continue;

			const actualX = margin + (cellSize * x);
			const actualY = margin + (cellSize * y);
			for (let py = actualY; py < actualY + cellSize; py++) {
				pixels.fill(whiteIndex, (py * size) + actualX, (py * size) + actualX + cellSize);
			}
		}
	}

	// グラデーション部分はPaethフィルタでほぼ0になり、よく圧縮される
	const scanlines = Buffer.alloc(stride * size);
	for (let y = 0; y < size; y++) {
		scanlines[y * stride] = paethFilter;
		for (let x = 0; x < size; x++) {
			const left = x > 0 ? pixels[(y * size) + x - 1] : 0;
			const up = y > 0 ? pixels[((y - 1) * size) + x] : 0;
			const upLeft = x > 0 && y > 0 ? pixels[((y - 1) * size) + x - 1] : 0;
			scanlines[(y * stride) + 1 + x] = pixels[(y * size) + x] - paethPredictor(left, up, upLeft);
		}
	}

	return Buffer.concat([
		pngSignature,
		pngChunk('IHDR', pngHeader),
		pngChunk('PLTE', palette),
		pngChunk('IDAT', zlib.deflateSync(scanlines)),
		pngChunk('IEND', Buffer.alloc(0)),
	]);
}
