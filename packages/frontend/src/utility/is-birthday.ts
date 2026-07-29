/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

export function isBirthday(user: Misskey.entities.UserDetailed, now = new Date()): boolean {
	if (user.birthday == null) return false;

	const [_, bm, bd] = user.birthday.split('-').map((v) => parseInt(v, 10));
	if (isNaN(bm) || isNaN(bd)) return false;

	const y = now.getFullYear();
	const m = now.getMonth() + 1;
	const d = now.getDate();

	// 閏日生まれで平年の場合は3月1日を誕生日として扱う
	if (bm === 2 && bd === 29 && m === 3 && d === 1 && !isLeapYear(y)) {
		return true;
	}

	return m === bm && d === bd;
}

function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}
