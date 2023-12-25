/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as crypto from 'node:crypto';

export const L_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const LU_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export function secureRndstr(length = 32, { chars = LU_CHARS } = {}): string {
	const chars_len = chars.length;

	let str = '';

	for (let i = 0; i < length; i++) {
		let rand = Math.floor((crypto.randomBytes(1).readUInt8(0) / 0xFF) * chars_len);
		if (rand === chars_len) {
			rand = chars_len - 1;
		}
		str += chars.charAt(rand);
	}

	return str;
}
