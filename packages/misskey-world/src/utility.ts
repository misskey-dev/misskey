/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// ベクトルが小さいと動きが不自然になったりするので大きくする
// https://forum.babylonjs.com/t/the-camera-isnt-moving-correctly-in-my-custom-input/63286/2
export const WORLD_SCALE = 100;

//// cm to meter. 二重に適用しないように注意すること。
//export const cm = (value: number) => value / 100;
export const cm = (value: number) => value;

export function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number) {
	return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

// ex) hangingTShirt -> hanging-t-shirt
export const camelToKebab = (s: string) => {
	return s
		.replace(/([a-z0-9])([A-Z])/g, '$1-$2')
		.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
		.toLowerCase();
};

export function getHex(c: [number, number, number]) {
	return `#${c.map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')}`;
}

export function getRgb(hex: string | number): [number, number, number] | null {
	if (
		typeof hex === 'number' ||
		typeof hex !== 'string' ||
		!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)
	) {
		return null;
	}

	const m = hex.slice(1).match(/[0-9a-fA-F]{2}/g);
	if (m == null) return [0, 0, 0];
	return m.map(x => parseInt(x, 16) / 255) as [number, number, number];
}
