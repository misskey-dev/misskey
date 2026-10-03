/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Locale } from 'i18n';
import type { I18n } from './i18n.js';

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
export function formatRelativeTime(i18n: I18n<Locale>, ago: number): string {
	return (
		ago >= 31536000 ? i18n.tsx._ago.yearsAgo({ n: Math.round(ago / 31536000).toString() }) :
		ago >= 2592000 ? i18n.tsx._ago.monthsAgo({ n: Math.round(ago / 2592000).toString() }) :
		ago >= 604800 ? i18n.tsx._ago.weeksAgo({ n: Math.round(ago / 604800).toString() }) :
		ago >= 86400 ? i18n.tsx._ago.daysAgo({ n: Math.round(ago / 86400).toString() }) :
		ago >= 3600 ? i18n.tsx._ago.hoursAgo({ n: Math.round(ago / 3600).toString() }) :
		ago >= 60 ? i18n.tsx._ago.minutesAgo({ n: (~~(ago / 60)).toString() }) :
		ago >= 10 ? i18n.tsx._ago.secondsAgo({ n: (~~(ago % 60)).toString() }) :
		ago >= -3 ? i18n.ts._ago.justNow :
		ago < -31536000 ? i18n.tsx._timeIn.years({ n: Math.round(-ago / 31536000).toString() }) :
		ago < -2592000 ? i18n.tsx._timeIn.months({ n: Math.round(-ago / 2592000).toString() }) :
		ago < -604800 ? i18n.tsx._timeIn.weeks({ n: Math.round(-ago / 604800).toString() }) :
		ago < -86400 ? i18n.tsx._timeIn.days({ n: Math.round(-ago / 86400).toString() }) :
		ago < -3600 ? i18n.tsx._timeIn.hours({ n: Math.round(-ago / 3600).toString() }) :
		ago < -60 ? i18n.tsx._timeIn.minutes({ n: (~~(-ago / 60)).toString() }) :
		i18n.tsx._timeIn.seconds({ n: (~~(-ago % 60)).toString() })
	);
}
