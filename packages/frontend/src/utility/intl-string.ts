/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { versatileLang } from '@@/js/intl-const.js';
import type { toHiragana as toHiraganaType } from 'wanakana';

let toHiragana: typeof toHiraganaType = (str?: string) => str ?? '';
let isWanakanaLoaded = false;

/**
 * ローマ字変換のセットアップ（日本語以外の環境で読み込まないのでlazy-loading）
 *
 * ここの比較系関数を使う際は事前に呼び出す必要がある
 */
export async function initIntlString(forceWanakana = false) {
	if ((!versatileLang.includes('ja') && !forceWanakana) || isWanakanaLoaded) return;
	const { toHiragana: _toHiragana } = await import('wanakana');
	toHiragana = _toHiragana;
	isWanakanaLoaded = true;
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

// https://qiita.com/non-caffeine/items/77360dda05c8ce510084
const hyphens = [
	0x002d, // hyphen-minus
	0x02d7, // modifier letter minus sign
	0x1173, // hangul jongseong eu
	0x1680, // ogham space mark
	0x1b78, // balinese musical symbol left-hand open pang
	0x2010, // hyphen
	0x2011, // non-breaking hyphen
	0x2012, // figure dash
	0x2013, // en dash
	0x2014, // em dash
	0x2015, // horizontal bar
	0x2043, // hyphen bullet
	0x207b, // superscript minus
	0x2212, // minus sign
	0x25ac, // black rectangle
	0x2500, // box drawings light horizontal
	0x2501, // box drawings heavy horizontal
	0x2796, // heavy minus sign
	0x30fc, // katakana-hiragana prolonged sound mark
	0x3161, // hangul letter eu
	0xfe58, // small em dash
	0xfe63, // small hyphen-minus
	0xff0d, // fullwidth hyphen-minus
	0xff70, // halfwidth katakana-hiragana prolonged sound mark
	0x10110, // aegean number ten
	0x10191, // roman uncia sign
];

const hyphensCodePoints = hyphens.map(code => `\\u{${code.toString(16).padStart(4, '0')}}`);
const hyphensRegex = new RegExp(`[${hyphensCodePoints.join('')}]`, 'ug');

/** ハイフンを統一（ローマ字半角入力時に`ー`と`-`が判定できない問題の調整） */
export function normalizeHyphens(str: string) {
	return str.replace(hyphensRegex, '\u002d');
}

/**
 * `normalizeString` に加えて、カタカナ・ローマ字をひらがなに揃え、ハイフンを統一
 *
 * （ローマ字じゃないものもローマ字として認識され変換されるので、文字列比較の際は `normalizeString` を併用する必要あり）
 */
export function normalizeStringWithHiragana(str: string) {
	return normalizeHyphens(toHiragana(normalizeString(str), { convertLongVowelMark: false }));
}

/** aとbが同じかどうか */
export function compareStringEquals(a: string, b: string) {
	if (a === b) return true; // まったく同じ場合はtrue。なお、ノーマライズ前後で文字数が変化することがあるため、文字数が違うからといってfalseにはできない
	if (normalizeString(a) === normalizeString(b)) return true;
	if (normalizeStringWithHiragana(a) === normalizeStringWithHiragana(b)) return true;
	return false;
}

/** baseにqueryが含まれているかどうか */
export function compareStringIncludes(base: string, query: string) {
	if (base === query) return true; // まったく同じ場合は含まれていると考えてよいのでtrue
	if (base.includes(query)) return true;
	if (normalizeString(base).includes(normalizeString(query))) return true;
	if (normalizeStringWithHiragana(base).includes(normalizeStringWithHiragana(query))) return true;
	return false;
}
