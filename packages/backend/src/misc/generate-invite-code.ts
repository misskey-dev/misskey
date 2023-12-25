/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { secureRndstr } from './secure-rndstr.js';

const CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // [0-9A-Z] w/o [01IO] (32 patterns)

export function generateInviteCode(): string {
	const code = secureRndstr(8, {
		chars: CHARS,
	});

	const uniqueId = [];
	let n = Math.floor(Date.now() / 1000 / 60);
	while (true) {
		uniqueId.push(CHARS[n % CHARS.length]);
		const t = Math.floor(n / CHARS.length);
		if (!t) break;
		n = t;
	}

	return code + uniqueId.reverse().join('');
}
