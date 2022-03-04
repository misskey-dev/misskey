/**
 * Identicon generator
 * https://en.wikipedia.org/wiki/Identicon
 */

import { WriteStream } from 'node:fs';
import * as p from 'pureimage';
import gen from 'random-seed';

const size = 256; // px
const n = 5; // resolution
const margin = (size / n);
const colors = [
	'#e57373',
	'#F06292',
	'#BA68C8',
	'#9575CD',
	'#7986CB',
	'#64B5F6',
	'#4FC3F7',
	'#4DD0E1',
	'#4DB6AC',
	'#81C784',
	'#8BC34A',
	'#AFB42B',
	'#F57F17',
	'#FF5722',
	'#795548',
	'#455A64',
];
const bg = '#e9e9e9';

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

	ctx.fillStyle = bg;
	ctx.beginPath();
	ctx.fillRect(0, 0, size, size);

	ctx.fillStyle = colors[rand(colors.length)];

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
