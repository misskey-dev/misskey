/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type HEX = string;

export type RGB = {
	readonly r: number;
	readonly g: number;
	readonly b: number;
};

const DEFAULT_HEX = '#ff0000' as const satisfies HEX;
const DEFAULT_RGB = { r: 255, g: 0, b: 0 } as const satisfies RGB;

export const hexToRgb = (hex: string): RGB => {
	if (hex.startsWith('#')) {
		hex = hex.slice(1);
	}
	if (hex.length === 3) {
		if (!validHex(hex)) {
			return DEFAULT_RGB;
		}
		hex = [...hex].map(char => char.repeat(2)).join('');
	}
	if (!(hex.length === 6 && validHex(hex))) {
		return DEFAULT_RGB;
	}
	const [r, g, b] = Array.from(hex.match(/.{2}/g) ?? [], n => parseInt(n, 16));
	return { r, g, b } as const satisfies RGB;
};

export const rgbToHex = (rgb: RGB): HEX => {
	if (!validRgb(rgb)) {
		return DEFAULT_HEX;
	}
	const toHex2Digit = (n: number): string => {
		return (n.toString(16).split('.').at(0) ?? '').padStart(2, '0');
	};
	const { r, g, b } = rgb;
	const hexR = toHex2Digit(r);
	const hexG = toHex2Digit(g);
	const hexB = toHex2Digit(b);
	return `#${hexR}${hexG}${hexB}` as const satisfies HEX;
};

const validHex = (hex: unknown): hex is string => {
	if (typeof hex !== 'string') return false;
	return /^[0-9a-f]+$/i.test(hex);
};

const validRgb = (rgb: unknown): rgb is RGB => {
	if (typeof rgb !== 'object' || rgb == null) return false;
	if (!('r' in rgb && 'g' in rgb && 'b' in rgb)) return false;
	const validRange = (n: unknown): boolean => {
		if (typeof n !== 'number') return false;
		if (!Number.isInteger(n)) return false;
		return 0 <= n && n <= 255;
	};
	const { r, g, b } = rgb;
	return validRange(r) && validRange(g) && validRange(b);
};
