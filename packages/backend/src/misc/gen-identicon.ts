/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Identicon generator
 * https://en.wikipedia.org/wiki/Identicon
 */

import * as p from 'pureimage';
import gen from 'random-seed';
import type { WriteStream } from 'node:fs';

const size = 128; // px
const n = 5; // resolution
const margin = (size / 4);
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

/**
 * Generate buffer of an identicon by seed
 */
export function genIdenticon(seed: string, stream: WriteStream): Promise<void> {
	const rand = gen.create(seed);
	const canvas = p.make(size, size, undefined);
	const ctx = canvas.getContext('2d');

	const bgColors = colors[rand(colors.length)];

	const bg = ctx.createLinearGradient(0, 0, size, size);
	bg.addColorStop(0, bgColors[0]);
	bg.addColorStop(1, bgColors[1]);

	ctx.fillStyle = bg as any;
	ctx.beginPath();
	ctx.fillRect(0, 0, size, size);

	ctx.fillStyle = '#ffffff';

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
			ctx.beginPath();
			ctx.fillRect(actualX, actualY, cellSize, cellSize);
		}
	}

	return p.encodePNGToStream(canvas, stream);
}
