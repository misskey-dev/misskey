/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as Misskey from 'misskey-js';
import * as AhoCorasick from 'modern-ahocorasick';
export function checkWordMute(
	note: Misskey.entities.Note,
	me: Misskey.entities.UserLite | null | undefined,
	mutedWords: Array<string | string[]>,
): Array<string | string[]> | false {
	// 自分自身の投稿は対象外
	if (me && (note.userId === me.id)) return false;
	if (mutedWords.length <= 0) return false;

	const text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();
	if (text === '') return false;

	const normalTexts: string[] = [];
	const andTexts: string[][] = [];
	const regexTexts: Array<{ originaL: string; regex: RegExp }> = [];

	for (const filter of mutedWords) {
		if (Array.isArray(filter)) {
			if (filter.length === 1) {
				normalTexts.push(filter[0]);
			} else {
				andTexts.push(filter);
			}
		} else if (filter.startsWith('/') && filter.endsWith('/')) {
			const regExp = filter.match(/^\/(.+)\/(.*)$/);
			if (!regExp) continue;
			try {
				regexTexts.push({ originaL: filter, regex: new RegExp(filter.slice(1, -1)) });
			} catch {
				// 無効な正規表現はスキップ
			}
		} else {
			normalTexts.push(filter);
		}
	}
	// normal wordmute with AhoCorasick
	const ac = new AhoCorasick.default(normalTexts);
	const normalMatches = ac.search(text);

	// andTexts
	const andMatches = andTexts.filter(texts => texts.filter(keyword => keyword !== '').every(keyword => text.includes(keyword)));

	// RegExp
	const regexMatches = regexTexts.filter(({ regex }) => regex.test(text));

	const matched: Array<string | string[]> = normalMatches.map(match	=> match[1]).concat(andMatches, regexMatches.map(({ originaL }) => originaL));

	return matched.length > 0 ? matched : false;
}
