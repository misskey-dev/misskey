/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const map: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	'\'': '&apos;',
};

const beginingOfCDATA = '<![CDATA[';
const endOfCDATA = ']]>';

export function escapeValue(x: string): string {
	let insideOfCDATA = false;
	let builder = '';
	for (
		let i = 0;
		i < x.length;
	) {
		if (insideOfCDATA) {
			if (x.slice(i, i + beginingOfCDATA.length) === beginingOfCDATA) {
				insideOfCDATA = true;
				i += beginingOfCDATA.length;
			} else {
				builder += x[i++];
			}
		} else {
			if (x.slice(i, i + endOfCDATA.length) === endOfCDATA) {
				insideOfCDATA = false;
				i += endOfCDATA.length;
			} else {
				const b = x[i++];
				builder += map[b] || b;
			}
		}
	}
	return builder;
}

export function escapeAttribute(x: string): string {
	return Object.entries(map).reduce((a, [k, v]) => a.replace(k, v), x);
}
