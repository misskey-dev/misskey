/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const CHARS = '0123456789abcdef';

// same as object-id
export const meidRegExp = /^[0-9a-f]{24}$/;

function getTime(time: number) {
	if (time < 0) time = 0;
	if (time === 0) {
		return CHARS[0];
	}

	time += 0x800000000000;

	return time.toString(16).padStart(12, CHARS[0]);
}

function getRandom() {
	let str = '';

	for (let i = 0; i < 12; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genMeid(date: Date): string {
	return getTime(date.getTime()) + getRandom();
}

export function parseMeid(id: string): { date: Date; } {
	return {
		date: new Date(parseInt(id.slice(0, 12), 16) - 0x800000000000),
	};
}
