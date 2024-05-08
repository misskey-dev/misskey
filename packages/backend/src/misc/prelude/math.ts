/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function gcd(a: number, b: number): number {
	return b === 0 ? a : gcd(b, a % b);
}
