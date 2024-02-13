/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function isDeviceDarkmode() {
	return window.matchMedia('(prefers-color-scheme: dark)').matches;
}
