
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { versatileLang } from '@@/js/intl-const.js';

export function createDateTimeFormatter(options: Intl.DateTimeFormatOptions) {
	try {
		return new Intl.DateTimeFormat(versatileLang, options);
	} catch {
		// Fallback to en-US
		return new Intl.DateTimeFormat('en-US', options);
	}
}

export function createNumberFormatter(options?: Intl.NumberFormatOptions) {
	try {
		return new Intl.NumberFormat(versatileLang, options);
	} catch {
		// Fallback to en-US
		return new Intl.NumberFormat('en-US', options);
	}
}
