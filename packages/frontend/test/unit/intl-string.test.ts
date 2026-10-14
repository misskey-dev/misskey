/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assert, beforeEach, describe, test } from 'vitest';
import {
	normalizeString,
	initIntlString,
	normalizeStringWithHiragana,
	compareStringEquals,
	compareStringIncludes,
} from '@/utility/intl-string.js';

// 共通のテストを実行するヘルパー関数
const runCommonTests = (normalizeFn: (str: string) => string) => {
	test('全角英数字が半角の小文字になる', () => {
		// ローマ字にならないようにする
		const input = 'Ｂ１２３';
		const expected = 'b123';
		assert.strictEqual(normalizeFn(input), expected);
	});
	test('濁点・半濁点が正しく結合される', () => {
		const input = 'か\u3099';
		const expected = 'が';
		assert.strictEqual(normalizeFn(input), expected);
	});
	test('小文字に揃う', () => {
		// ローマ字にならないようにする
		const input = 'tSt';
		const expected = 'tst';
		assert.strictEqual(normalizeFn(input), expected);
	});
	test('文字列の前後の空白が削除される', () => {
		const input = '   tst   ';
		const expected = 'tst';
		assert.strictEqual(normalizeFn(input), expected);
	});
};

describe('normalize string', () => {
	runCommonTests(normalizeString);

	test('異体字の正規化 (ligature)', () => {
		const input = 'ﬁ';
		const expected = 'fi';
		assert.strictEqual(normalizeString(input), expected);
	});

	test('半角カタカナは全角に変換される', () => {
		const input = 'ｶﾀｶﾅ';
		const expected = 'カタカナ';
		assert.strictEqual(normalizeString(input), expected);
	});
});

// normalizeStringWithHiraganaのテスト
describe('normalize string with hiragana', () => {
	beforeEach(async () => {
		await initIntlString(true);
	});

	// 共通テスト
	describe('共通のnormalizeStringテスト', () => {
		runCommonTests(normalizeStringWithHiragana);
	});

	test('半角カタカナがひらがなに変換される', () => {
		const input = 'ｶﾀｶﾅ';
		const expected = 'かたかな';
		assert.strictEqual(normalizeStringWithHiragana(input), expected);
	});

	// normalizeStringWithHiragana特有のテスト
	test('カタカナがひらがなに変換される・伸ばし棒はハイフンに変換される', () => {
		const input = 'カタカナひーらがーな';
		const expected = 'かたかなひ-らが-な';
		assert.strictEqual(normalizeStringWithHiragana(input), expected);
	});

	test('ローマ字がひらがなに変換される', () => {
		const input = 'ro-majimohiragananinarimasu';
		const expected = 'ろ-まじもひらがなになります';
		assert.strictEqual(normalizeStringWithHiragana(input), expected);
	});
});

describe('compareStringEquals', () => {
	beforeEach(async () => {
		await initIntlString(true);
	});

	test('完全一致ならtrue', () => {
		assert.isTrue(compareStringEquals('テスト', 'テスト'));
	});

	test('大文字・小文字の違いを無視', () => {
		assert.isTrue(compareStringEquals('TeSt', 'test'));
	});

	test('全角・半角の違いを無視', () => {
		assert.isTrue(compareStringEquals('ＡＢＣ', 'abc'));
	});

	test('カタカナとひらがなの違いを無視', () => {
		assert.isTrue(compareStringEquals('カタカナ', 'かたかな'));
	});

	test('ローマ字をひらがなと比較可能', () => {
		assert.isTrue(compareStringEquals('hiragana', 'ひらがな'));
	});

	test('異なる文字列はfalse', () => {
		assert.isFalse(compareStringEquals('テスト', 'サンプル'));
	});
});

describe('compareStringIncludes', () => {
	test('部分一致ならtrue', () => {
		assert.isTrue(compareStringIncludes('これはテストです', 'テスト'));
	});

	test('大文字・小文字の違いを無視', () => {
		assert.isTrue(compareStringIncludes('This is a Test', 'test'));
	});

	test('全角・半角の違いを無視', () => {
		assert.isTrue(compareStringIncludes('ＡＢＣＤＥ', 'abc'));
	});

	test('カタカナとひらがなの違いを無視', () => {
		assert.isTrue(compareStringIncludes('カタカナのテスト', 'かたかな'));
	});

	test('ローマ字をひらがなと比較可能', () => {
		assert.isTrue(compareStringIncludes('これはhiraganaのテスト', 'ひらがな'));
	});

	test('異なる文字列はfalse', () => {
		assert.isFalse(compareStringIncludes('これはテストです', 'サンプル'));
	});
});
