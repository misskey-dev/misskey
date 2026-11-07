/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as Misskey from 'misskey-js';

export type WordMuteResult = Array<string | string[]> | false;

// ミュートワードの判定はタイムラインのノートごとに繰り返し実行されるため、
// フィルタ単位の前処理(正規表現のコンパイル・空キーワードの除去)をキャッシュする
// keywordsCacheはWeakMapによりフィルタ配列がGCされるとキャッシュも破棄される
const regexCache = new Map<string, RegExp | null>();
const keywordsCache = new WeakMap<string[], string[]>();

function getCompiledRegex(filter: string): RegExp | null {
	let regex = regexCache.get(filter);
	if (regex === undefined) {
		const parts = filter.match(/^\/(.+)\/(.*)$/);
		if (parts == null) {
			// This should never happen due to input sanitisation.
			regex = null;
		} else {
			try {
				regex = new RegExp(parts[1], parts[2]);
			} catch (_) {
				// This should never happen due to input sanitisation.
				regex = null;
			}
		}
		regexCache.set(filter, regex);
	}
	return regex;
}

function getCleanedKeywords(filter: string[]): string[] {
	let keywords = keywordsCache.get(filter);
	if (keywords === undefined) {
		keywords = filter.filter(keyword => keyword !== '');
		keywordsCache.set(filter, keywords);
	}
	return keywords;
}

export function checkWordMute(note: Misskey.entities.Note, me: Misskey.entities.UserLite | null | undefined, mutedWords: Array<string | string[]>): WordMuteResult {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length === 0) return false;

	const text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();

	if (text !== '') {
		const matched = mutedWords.filter(filter => {
			if (Array.isArray(filter)) {
				const keywords = getCleanedKeywords(filter);
				if (keywords.length === 0) return false;

				return keywords.every(keyword => text.includes(keyword));
			} else {
				// represents RegExp
				const regex = getCompiledRegex(filter);
				if (regex == null) return false;

				// gフラグ等が付いているとtestでlastIndexが進み、共有インスタンスでは結果が変わってしまうためリセットする
				regex.lastIndex = 0;
				return regex.test(text);
			}
		});

		if (matched.length > 0) return matched;
	}

	return false;
}
