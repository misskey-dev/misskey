/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* objを検査して
 * 1. 配列に何も入っていない時はクエリを付けない
 * 2. プロパティがundefinedの時はクエリを付けない
 * （new URLSearchParams(obj)ではそこまで丁寧なことをしてくれない）
 */
export function query(obj: Record<string, string | number | boolean>): string {
	const params = Object.entries(obj)
		.filter(([, v]) => Array.isArray(v) ? v.length : v !== undefined) // eslint-disable-line @typescript-eslint/no-unnecessary-condition
		.reduce<Record<string, string | number | boolean>>((a, [k, v]) => (a[k] = v, a), {});

	return Object.entries(params)
		.map((p) => `${p[0]}=${encodeURIComponent(p[1])}`)
		.join('&');
}

export function appendQuery(url: string, queryString: string): string {
	return `${url}${/\?/.test(url) ? url.endsWith('?') ? '' : '&' : '?'}${queryString}`;
}

export function extractDomain(url: string) {
	const match = url.match(/^(?:https?:)?(?:\/\/)?(?:[^@\n]+@)?([^:\/\n]+)/im);
	return match ? match[1] : null;
}
