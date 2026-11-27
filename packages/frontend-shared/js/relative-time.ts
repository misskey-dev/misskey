/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Locale } from 'i18n';
import type { I18n } from './i18n.js';

type Tsx = I18n<Locale>['tsx'];

/**
 * {@link formatRelativeTime} で使う翻訳文字列
 * locale-inliner でビルド時に埋め込まれるよう、呼び出し側で `i18n.tsx._ago` などを渡す
 */
export type RelativeTimeLocale = {
	ago: Tsx['_ago'];
	timeIn: Tsx['_timeIn'];
	justNow: string;
};

/**
 * 日時をUNIXミリ秒に変換する。不正な値の場合は NaN を返す
 */
export function parseTime(time: Date | string | number | null): number {
	if (time == null) return NaN;
	try {
		if (time instanceof Date) {
			return time.getTime();
		}
		return new Date(time).getTime();
	} catch {
		return NaN;
	}
}

/**
 * 「n分前」「n日後」のような相対時刻の文字列を返す
 * @param ago 経過秒数 (未来の場合は負の値)
 */
export function formatRelativeTime(ago: number, locale: RelativeTimeLocale): string {
	return (
		ago >= 31536000 ? locale.ago.yearsAgo({ n: Math.round(ago / 31536000).toString() }) :
		ago >= 2592000 ? locale.ago.monthsAgo({ n: Math.round(ago / 2592000).toString() }) :
		ago >= 604800 ? locale.ago.weeksAgo({ n: Math.round(ago / 604800).toString() }) :
		ago >= 86400 ? locale.ago.daysAgo({ n: Math.round(ago / 86400).toString() }) :
		ago >= 3600 ? locale.ago.hoursAgo({ n: Math.round(ago / 3600).toString() }) :
		ago >= 60 ? locale.ago.minutesAgo({ n: (~~(ago / 60)).toString() }) :
		ago >= 10 ? locale.ago.secondsAgo({ n: (~~(ago % 60)).toString() }) :
		ago >= -3 ? locale.justNow :
		ago < -31536000 ? locale.timeIn.years({ n: Math.round(-ago / 31536000).toString() }) :
		ago < -2592000 ? locale.timeIn.months({ n: Math.round(-ago / 2592000).toString() }) :
		ago < -604800 ? locale.timeIn.weeks({ n: Math.round(-ago / 604800).toString() }) :
		ago < -86400 ? locale.timeIn.days({ n: Math.round(-ago / 86400).toString() }) :
		ago < -3600 ? locale.timeIn.hours({ n: Math.round(-ago / 3600).toString() }) :
		ago < -60 ? locale.timeIn.minutes({ n: (~~(-ago / 60)).toString() }) :
		locale.timeIn.seconds({ n: (~~(-ago % 60)).toString() })
	);
}
