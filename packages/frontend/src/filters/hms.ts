/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';

export function hms(ms: number, options?: {
	textFormat?: 'colon' | 'locale';
	enableSeconds?: boolean;
	enableMs?: boolean;
}) {
	const _options = {
		textFormat: 'colon',
		enableSeconds: true,
		enableMs: false,
		...options,
	};

	const res: {
		h?: string;
		m?: string;
		s?: string;
		ms?: string;
	} = {};

	// ミリ秒を秒に変換
	let seconds = Math.floor(ms / 1000);

	// 小数点以下の値（２位まで）
	const mili = ms - seconds * 1000;

	// 時間を計算
	const hours = Math.floor(seconds / 3600);
	res.h = format(hours);
	seconds %= 3600;

	// 分を計算
	const minutes = Math.floor(seconds / 60);
	res.m = format(minutes);
	seconds %= 60;

	// 残った秒数を取得
	seconds = seconds % 60;
	res.s = format(seconds);

	// ミリ秒を取得
	res.ms = format(Math.floor(mili / 10));

	// 結果を返す
	if (_options.textFormat === 'locale') {
		res.h += i18n.ts._time.hour;
		res.m += i18n.ts._time.minute;
		res.s += i18n.ts._time.second;
	}
	return [
		res.h.startsWith('00') ? undefined : res.h,
		res.m,
		(_options.enableSeconds ? res.s : undefined),
	].filter(v => v !== undefined).join(_options.textFormat === 'colon' ? ':' : ' ') + (_options.enableMs ? _options.textFormat === 'colon' ? `.${res.ms}` : ` ${res.ms}` : '');
}

function format(n: number) {
	return n.toString().padStart(2, '0');
}
