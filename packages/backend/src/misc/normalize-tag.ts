/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * NFKC 正規化を行う入力の最大長 (UTF-16 code unit 数)
 *
 * ハッシュタグは正規化前の時点で 128 文字 (code point) 以下のものだけが保存され、
 * API の入力も同様に 128 文字までに制限しているため、
 * それを超える長さ (サロゲートペアを考慮して 2 倍) の入力は正規化を省略する。
 */
const MAX_NORMALIZE_LENGTH = 128 * 2;

export function normalizeTag(tag: string): string {
	if (tag.length > MAX_NORMALIZE_LENGTH) {
		return tag.toLowerCase();
	}

	// ref.
	// - https://analytics-note.xyz/programming/unicode-normalization-forms/
	// - https://maku77.github.io/js/string/normalize.html
	return tag.normalize('NFKC').toLowerCase();
}
