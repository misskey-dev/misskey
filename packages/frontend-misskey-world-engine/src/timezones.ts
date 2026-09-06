/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const timezones = [{
	name: 'UTC',
	abbrev: 'UTC',
	offset: 0,
}, {
	name: 'Europe/Berlin',
	abbrev: 'CET',
	offset: 60,
}, {
	name: 'Asia/Tokyo',
	abbrev: 'JST',
	offset: 540,
}, {
	name: 'Asia/Seoul',
	abbrev: 'KST',
	offset: 540,
}, {
	name: 'Asia/Shanghai',
	abbrev: 'CST',
	offset: 480,
}, {
	name: 'Australia/Sydney',
	abbrev: 'AEST',
	offset: 600,
}, {
	name: 'Australia/Darwin',
	abbrev: 'ACST',
	offset: 570,
}, {
	name: 'Australia/Perth',
	abbrev: 'AWST',
	offset: 480,
}, {
	name: 'America/New_York',
	abbrev: 'EST',
	offset: -300,
}, {
	name: 'America/Mexico_City',
	abbrev: 'CST',
	offset: -360,
}, {
	name: 'America/Phoenix',
	abbrev: 'MST',
	offset: -420,
}, {
	name: 'America/Los_Angeles',
	abbrev: 'PST',
	offset: -480,
}];

export function getTimezoneAbbrev(timezone: string | null): string {
	if (timezone === null) {
		return timezones.find((tz) => tz.name.toLowerCase() === Intl.DateTimeFormat().resolvedOptions().timeZone.toLowerCase())?.abbrev ?? '?';
	} else {
		return timezones.find((tz) => tz.name.toLowerCase() === timezone.toLowerCase())?.abbrev ?? '?';
	}
}

export function getTimezoneOffset(timezone: string | null): number {
	if (timezone === null) {
		return 0 - new Date().getTimezoneOffset();
	} else {
		return timezones.find((tz) => tz.name.toLowerCase() === timezone.toLowerCase())?.offset ?? 0;
	}
}

export function getTimezoneOffsetLabel(tzOffset: number): string {
	return (tzOffset >= 0 ? '+' : '-') + Math.floor(tzOffset / 60).toString().padStart(2, '0') + ':' + (tzOffset % 60).toString().padStart(2, '0');
}
