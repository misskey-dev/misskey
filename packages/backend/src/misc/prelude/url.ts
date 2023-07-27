/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* objを検査して
 * 1. 配列に何も入っていない時はクエリを付けない
 * 2. プロパティがundefinedの時はクエリを付けない
 * （new URLSearchParams(obj)ではそこまで丁寧なことをしてくれない）
 */
export function query(obj: Record<string, unknown>): string {
	const params = Object.entries(obj)
		.filter(([, v]) => Array.isArray(v) ? v.length : v !== undefined)
		.reduce((a, [k, v]) => (a[k] = v, a), {} as Record<string, any>);

	return Object.entries(params)
		.map((e) => `${e[0]}=${encodeURIComponent(e[1])}`)
		.join('&');
}

export function appendQuery(url: string, query: string): string {
	return `${url}${/\?/.test(url) ? url.endsWith('?') ? '' : '&' : '?'}${query}`;
}
