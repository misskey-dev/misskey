/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lang } from '@/config.js';

export const versatileLang = (lang ?? 'ja-JP').replace('ja-KS', 'ja-JP');

let _dateTimeFormat: Intl.DateTimeFormat;
try {
	_dateTimeFormat = new Intl.DateTimeFormat(versatileLang, {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	});
} catch (err) {
	console.warn(err);
	if (_DEV_) console.log('[Intl] Fallback to en-US');

	// Fallback to en-US
	_dateTimeFormat = new Intl.DateTimeFormat('en-US', {
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	});
}
export const dateTimeFormat = _dateTimeFormat;

let _numberFormat: Intl.NumberFormat;
try {
	_numberFormat = new Intl.NumberFormat(versatileLang);
} catch (err) {
	console.warn(err);
	if (_DEV_) console.log('[Intl] Fallback to en-US');

	// Fallback to en-US
	_numberFormat = new Intl.NumberFormat('en-US');
}
export const numberFormat = _numberFormat;
