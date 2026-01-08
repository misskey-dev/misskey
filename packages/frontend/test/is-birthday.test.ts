/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { describe, test, expect } from 'vitest';
import { isBirthday } from '@/utility/is-birthday.js';

describe('isBirthday', () => {
	test('通常の誕生日', () => {
		const currentDate = new Date('2024-05-15');
		const result = isBirthday({
			birthday: '2000-05-15',
		} as Misskey.entities.UserDetailed, currentDate);

		expect(result).toBe(true);
	});

	test('誕生日ではない場合', () => {
		const currentDate = new Date('2024-05-15');
		const result = isBirthday({
			birthday: '2000-06-20',
		} as Misskey.entities.UserDetailed, currentDate);

		expect(result).toBe(false);
	});

	test('平年に閏日生まれを見た際に3月1日を誕生日とする', () => {
		const currentDate = new Date('2023-03-01');
		const result = isBirthday({
			birthday: '2000-02-29',
		} as Misskey.entities.UserDetailed, currentDate);

		expect(result).toBe(true);
	});

	test('閏年に閏日生まれを見た際に2月29日を誕生日とする', () => {
		const currentDate = new Date('2024-02-29');
		const result = isBirthday({
			birthday: '2000-02-29',
		} as Misskey.entities.UserDetailed, currentDate);

		expect(result).toBe(true);
	});

	test('閏年に閏日生まれを見た際に3月1日を誕生日としない', () => {
		const currentDate = new Date('2024-03-01');
		const result = isBirthday({
			birthday: '2000-02-29',
		} as Misskey.entities.UserDetailed, currentDate);

		expect(result).toBe(false);
	});
});
