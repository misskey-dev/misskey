/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function checkHttps(url: string): boolean {
	return url.startsWith('https://') ||
		(url.startsWith('http://') && process.env.NODE_ENV !== 'production');
}
