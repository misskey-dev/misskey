/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const ESCAPE_LOOKUP = {
	'&': '\\u0026',
	'>': '\\u003e',
	'<': '\\u003c',
	'\u2028': '\\u2028',
	'\u2029': '\\u2029',
} as Record<string, string>;

const ESCAPE_REGEX = /[&><\u2028\u2029]/g;

export function htmlSafeJsonStringify(obj: any): string {
	return JSON.stringify(obj).replace(ESCAPE_REGEX, x => ESCAPE_LOOKUP[x]);
}
