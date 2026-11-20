/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const unicodeEmojiCategories = ['face', 'people', 'animals_and_nature', 'food_and_drink', 'activity', 'travel_and_places', 'objects', 'symbols', 'flags'] as const;

/**
 * 特殊ケース対応用のUnicode絵文字の正規化
 * key → value に変換する。
 */
const unicodeConvertTable: Record<string, string> = {
	// eye in speech bubble (Twemojiのバグで、異体字セレクタが抜けていた) を正規化。
	'\u{1f441}\u{200d}\u{1f5e8}': '\u{1f441}\u{fe0f}\u200d\u{1f5e8}\u{fe0f}',
};

export type UnicodeEmojiDef = {
	name: string;
	char: string;
	category: typeof unicodeEmojiCategories[number];
};

import _emojilist from '@misskey-dev/emoji-data/emojilist.json';

export const emojilist: UnicodeEmojiDef[] = _emojilist.map(x => ({
	name: x[1] as string,
	char: x[0] as string,
	category: unicodeEmojiCategories[x[2] as number],
}));

const unicodeEmojisMap = new Map<string, UnicodeEmojiDef>(
	emojilist.map(x => [x.char, x]),
);

const _indexByChar = new Map<string, number>();
const _charGroupByCategory = new Map<string, string[]>();
for (let i = 0; i < emojilist.length; i++) {
	const emo = emojilist[i];
	_indexByChar.set(emo.char, i);

	if (_charGroupByCategory.has(emo.category)) {
		_charGroupByCategory.get(emo.category)?.push(emo.char);
	} else {
		_charGroupByCategory.set(emo.category, [emo.char]);
	}
}

export const emojiCharByCategory = _charGroupByCategory;

export function getUnicodeEmojiOrNull(char: string): UnicodeEmojiDef | null {
	// Colorize it because emojilist.json assumes that
	return unicodeEmojisMap.get(forceColorizeEmoji(char))
		// カラースタイル絵文字がjsonに無い場合はテキストスタイル絵文字にフォールバックする
		?? unicodeEmojisMap.get(char)
		// それでも見つからない場合はnullを返す
		?? null;
}

export function getUnicodeEmoji(char: string): UnicodeEmojiDef | string {
	// 絵文字が見つからない場合はそのまま返す（絵文字情報がjsonに無い場合、このフォールバックが無いとレンダリングに失敗する）
	return getUnicodeEmojiOrNull(char) ?? char;
}

export function isSupportedEmoji(char: string): boolean {
	const _char = unicodeConvertTable[char] ?? char;
	return unicodeEmojisMap.has(forceColorizeEmoji(_char)) || unicodeEmojisMap.has(_char);
}

// @ts-ignore
window.isSupportedEmoji = isSupportedEmoji;

export function getEmojiName(char: string): string {
	// Colorize it because emojilist.json assumes that
	const idx = _indexByChar.get(forceColorizeEmoji(char)) ?? _indexByChar.get(char);
	if (idx === undefined) {
		// 絵文字情報がjsonに無い場合は名前の取得が出来ないのでそのまま返すしか無い
		return char;
	} else {
		return emojilist[idx].name;
	}
}

/**
 * テキストスタイル絵文字（U+260Eなどの1文字で表現される絵文字）をカラースタイル絵文字に変換します（VS16:U+FE0Fを付与）。
 */
export function colorizeEmoji(char: string) {
	// <文字列>.length はコードポイント数ではなくUTF-16コードユニット数を返すため、サロゲートペアを含む絵文字で誤動作する。
	// そのため、配列に変換してコードポイント数を数える方法を取る。
	return Array.from(char).length === 1 ? `${char}\uFE0F` : char;
}

/**
 * 文字種にかかわらず、カラースタイル絵文字への変換を試みます（本ファイルにある検索プログラム用・フォールバックが必須）。
 */
function forceColorizeEmoji(char: string) {
	// <文字列>.length はコードポイント数ではなくUTF-16コードユニット数を返すため、サロゲートペアを含む絵文字で誤動作する。
	// そのため、配列に変換してコードポイント数を数える方法を取る。
	const chars = Array.from(char);
	if (chars.includes('\uFE0F')) {
		return char;
	} else {
		chars.splice(1, 0, '\uFE0F');
		return chars.join('');
	}
}

export function normalizeEmojiOrReaction(emoji: string) {
	let normalized = emoji.replace(/^:(\w+):$/, ':$1@.:');

	if (unicodeConvertTable[normalized]) {
		normalized = unicodeConvertTable[normalized];
	} else {
		normalized = normalized.match('\u200d') ? normalized : normalized.replace(/\ufe0f/g, '');
	}

	return normalized;
}

export interface CustomEmojiFolderTree {
	value: string;
	category: string;
	children: CustomEmojiFolderTree[];
}
