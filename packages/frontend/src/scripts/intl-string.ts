/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { versatileLang } from '@@/js/intl-const.js';
import type { toHiragana as toHiraganaType } from 'wanakana';

let toHiragana: typeof toHiraganaType = (str?: string) => str ?? '';

/** ローマ字変換のセットアップ（日本語以外の環境で読み込まないのでlazy-loading） */
export async function initIntlString() {
	if (!versatileLang.includes('ja')) return;
	const { toHiragana: _toHiragana } = await import('wanakana');
	toHiragana = _toHiragana;
}

/**
 * - 全角英数字を半角に
 * - 半角カタカナを全角に
 * - 濁点・半濁点がリガチャになっている（例: `か` ＋ `゛` ）ひらがな・カタカナを結合
 * - 異体字を正規化
 * - 小文字に揃える
 * - 文字列のトリム
 */
export function normalizeString(str: string) {
	const segmenter = new Intl.Segmenter(versatileLang, { granularity: 'grapheme' });
	return [...segmenter.segment(str)].map(({ segment }) => segment.normalize('NFKC')).join('').toLowerCase().trim();
}

/** ハイフンを統一（ローマ字半角入力時に`ー`と`-`が判定できない問題の調整） */
export function normalizeHyphens(str: string) {
	// https://qiita.com/non-caffeine/items/77360dda05c8ce510084
	const hyphens = [
		'\u002d', // hyphen-minus
		'\u02d7', // modifier letter minus sign
		'\u1173', // hangul jongseong eu
		'\u1680', // ogham space mark
		'\u1b78', // balinese musical symbol left-hand open pang
		'\u2010', // hyphen
		'\u2011', // non-breaking hyphen
		'\u2012', // figure dash
		'\u2013', // en dash
		'\u2014', // em dash
		'\u2015', // horizontal bar
		'\u2043', // hyphen bullet
		'\u207b', // superscript minus
		'\u2212', // minus sign
		'\u25ac', // black rectangle
		'\u2500', // box drawings light horizontal
		'\u2501', // box drawings heavy horizontal
		'\u2796', // heavy minus sign
		'\u30fc', // katakana-hiragana prolonged sound mark
		'\u3161', // hangul letter eu
		'\ufe58', // small em dash
		'\ufe63', // small hyphen-minus
		'\uff0d', // fullwidth hyphen-minus
		'\uff70', // halfwidth katakana-hiragana prolonged sound mark
		'\u{10110}', // aegean number ten
		'\u{10191}', // roman uncia sign
	];

	return str.replace(new RegExp(`[${hyphens.join('')}]`, 'g'), '\u002d');
}

/**
 * `normalizeString` に加えて、カタカナ・ローマ字をひらがなに揃える
 *
 * （ローマ字じゃないものもローマ字として認識され変換されるので、文字列比較の際は `normalizeString` を併用する必要あり）
 */
export function normalizeStringWithHiragana(str: string) {
	return normalizeHyphens(toHiragana(normalizeString(str)));
}

/** aとbが同じかどうか */
export function compareStringEquals(a: string, b: string) {
	return (
		normalizeString(a) === normalizeString(b) ||
		normalizeStringWithHiragana(a) === normalizeStringWithHiragana(b)
	);
}

/** baseにqueryが含まれているかどうか */
export function compareStringIncludes(base: string, query: string) {
	return (
		normalizeString(base).includes(normalizeString(query)) ||
		normalizeStringWithHiragana(base).includes(normalizeStringWithHiragana(query))
	);
}
