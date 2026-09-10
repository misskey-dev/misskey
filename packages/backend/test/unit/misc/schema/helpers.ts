/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import * as v from 'valibot';
import {
	MISSKEY_ID_REGEX,
	countCodePoints,
	integer,
	limit,
	maxCodePoints,
	minCodePoints,
	misskeyId,
	nullableEnum,
	paginationDateEntries,
	paginationEntries,
	uniqueArray,
} from '@/misc/schema/index.js';

describe('misc/schema:helpers', () => {
	describe('misskeyId()', () => {
		const schema = misskeyId();

		test('英数字のみ受け付ける', () => {
			expect(v.safeParse(schema, '9abcdefghij0123456789').success).toBe(true);
			expect(v.safeParse(schema, 'a').success).toBe(true);
		});

		test('英数字以外・空文字・非文字列は弾く', () => {
			expect(v.safeParse(schema, 'has-hyphen').success).toBe(false);
			expect(v.safeParse(schema, 'has_underscore').success).toBe(false);
			expect(v.safeParse(schema, '').success).toBe(false);
			expect(v.safeParse(schema, 123).success).toBe(false);
			expect(v.safeParse(schema, null).success).toBe(false);
		});
	});

	describe('integer()', () => {
		test('整数のみ受け付ける', () => {
			expect(v.safeParse(integer(), 3).success).toBe(true);
			expect(v.safeParse(integer(), 3.5).success).toBe(false);
			expect(v.safeParse(integer(), '3').success).toBe(false);
		});

		test('min / max は境界を含む', () => {
			const schema = integer({ min: 1, max: 3 });
			expect(v.safeParse(schema, 0).success).toBe(false);
			expect(v.safeParse(schema, 1).success).toBe(true);
			expect(v.safeParse(schema, 3).success).toBe(true);
			expect(v.safeParse(schema, 4).success).toBe(false);
		});
	});

	describe('limit()', () => {
		const schema = limit({ max: 100, def: 10 });

		test('省略時に default が入る', () => {
			expect(v.parse(schema, undefined)).toBe(10);
		});

		test('境界値', () => {
			expect(v.safeParse(schema, 1).success).toBe(true);
			expect(v.safeParse(schema, 0).success).toBe(false);
			expect(v.safeParse(schema, 100).success).toBe(true);
			expect(v.safeParse(schema, 101).success).toBe(false);
			expect(v.safeParse(schema, 10.5).success).toBe(false);
		});

		test('default 無しなら undefined は弾く', () => {
			expect(v.safeParse(limit({ max: 100 }), undefined).success).toBe(false);
		});
	});

	describe('countCodePoints()', () => {
		test('サロゲートペアを 1 と数える', () => {
			expect(countCodePoints('abc')).toBe(3);
			expect(countCodePoints('👍')).toBe(1);
			expect('👍'.length).toBe(2);
			expect(countCodePoints('あ👍a')).toBe(3);
		});
	});

	describe('minCodePoints() / maxCodePoints()', () => {
		test('境界値 (ASCII)', () => {
			const schema = v.pipe(v.string(), minCodePoints(1), maxCodePoints(3));
			expect(v.safeParse(schema, '').success).toBe(false);
			expect(v.safeParse(schema, 'a').success).toBe(true);
			expect(v.safeParse(schema, 'abc').success).toBe(true);
			expect(v.safeParse(schema, 'abcd').success).toBe(false);
		});

		test('コードポイント数で数える (v.maxLength との挙動差)', () => {
			const schema = v.pipe(v.string(), maxCodePoints(3));
			expect(v.safeParse(schema, '👍👍👍').success).toBe(true);
			expect(v.safeParse(schema, '👍👍👍👍').success).toBe(false);

			// UTF-16 コードユニットで数える v.maxLength は同じ入力を弾いてしまう
			expect(v.safeParse(v.pipe(v.string(), v.maxLength(3)), '👍👍👍').success).toBe(false);
		});

		test('minCodePoints もコードポイント数で数える', () => {
			expect(v.safeParse(v.pipe(v.string(), minCodePoints(2)), '👍').success).toBe(false);
			expect(v.safeParse(v.pipe(v.string(), minCodePoints(2)), '👍👍').success).toBe(true);
		});
	});

	describe('uniqueArray()', () => {
		const schema = v.pipe(v.array(v.string()), uniqueArray());

		test('重複が無ければ通る', () => {
			expect(v.safeParse(schema, []).success).toBe(true);
			expect(v.safeParse(schema, ['a', 'b']).success).toBe(true);
		});

		test('重複があれば弾く', () => {
			expect(v.safeParse(schema, ['a', 'a']).success).toBe(false);
		});
	});

	describe('nullableEnum()', () => {
		const schema = nullableEnum(['likeOnly', 'nonSensitiveOnly', null]);

		test('列挙値と null を受け付ける', () => {
			expect(v.safeParse(schema, 'likeOnly').success).toBe(true);
			expect(v.safeParse(schema, 'nonSensitiveOnly').success).toBe(true);
			expect(v.safeParse(schema, null).success).toBe(true);
		});

		test('列挙外は弾く', () => {
			expect(v.safeParse(schema, 'whatever').success).toBe(false);
			expect(v.safeParse(schema, undefined).success).toBe(false);
		});
	});

	describe('paginationEntries()', () => {
		test('limit / sinceId / untilId をこの順で返す', () => {
			expect(Object.keys(paginationEntries({ max: 100, default: 10 }))).toStrictEqual(['limit', 'sinceId', 'untilId']);
		});

		test('sinceId / untilId は省略可能な Misskey ID', () => {
			const schema = v.object(paginationEntries({ max: 30, default: 5 }));
			const parsed = v.safeParse(schema, {});
			expect(parsed.success).toBe(true);
			// default が付いた limit だけが補完され、省略されたキーは生えない
			expect(parsed.output).toStrictEqual({ limit: 5 });
			expect(v.safeParse(schema, { sinceId: 'not-an-id' }).success).toBe(false);
		});

		test('paginationDateEntries() は sinceDate / untilDate を返す', () => {
			expect(Object.keys(paginationDateEntries())).toStrictEqual(['sinceDate', 'untilDate']);
		});
	});
});
