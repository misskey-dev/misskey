/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { i18n } from '@/i18n.js';

export function hms(ms: number, options: {
	textFormat?: 'colon' | 'locale';
	enableSeconds?: boolean;
	enableMs?: boolean;
} = {
	textFormat: 'colon',
	enableSeconds: true,
	enableMs: false,
}) {
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
	if (hours > 0) res.h = format(hours);
	seconds %= 3600;

	// 分を計算
	const minutes = Math.floor(seconds / 60);
	if (minutes > 0) res.m = format(minutes);
	seconds %= 60;

	// 残った秒数を取得
	seconds = seconds % 60;
	res.s = format(seconds);

	// ミリ秒を取得
	res.ms = format(Math.floor(mili / 10));

	// 結果を返す
	if (options.textFormat === 'locale') {
		if (res.h) res.h = i18n.t('_hms.h', { h: res.h });
		if (res.m) res.m = i18n.t('_hms.m', { m: res.m });
		res.s = i18n.t('_hms.s', { s: res.s });
		res.ms = i18n.t('_hms.ms', { s: res.ms });
	}
	return [
		res.h ?? undefined,
		res.m ?? undefined,
		(options.enableSeconds ? res.s : undefined),
		(options.enableMs ? res.ms : undefined),
	].filter(v => v !== undefined).join(options.textFormat === 'colon' ? ':' : ' ');
}

function format(n: number) {
	return n.toString().padStart(2, '0');
}
