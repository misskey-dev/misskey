/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { lang } from '@/config';

export const versatileLang = (lang ?? 'ja-JP').replace('ja-KS', 'ja-JP');
export const dateTimeFormat = new Intl.DateTimeFormat(versatileLang, {
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	hour: 'numeric',
	minute: 'numeric',
	second: 'numeric',
});
export const numberFormat = new Intl.NumberFormat(versatileLang);
