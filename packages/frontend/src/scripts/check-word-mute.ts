/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
import * as AhoCorasick from 'modern-ahocorasick';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';
import type * as Misskey from 'misskey-js';
import { $i } from '@/account.js';

type WordMuteInfo = false | {
	normals: string[];
	and: string[][];
	regex: Array<{ original: string; regex: RegExp }>;
	ahoCorasick: AhoCorasick.default;
}

type GlobalMisskeyWordMute = {
	soft: WordMuteInfo;
	hard: WordMuteInfo;
};

function createWordMuteInfo(mutedWords: Array<string | string[]>) : WordMuteInfo {
	if (mutedWords.length <= 0) return false;
	const normalTexts: string[] = [];
	const andTexts: string[][] = [];
	const regexTexts: Array<{ original: string; regex: RegExp }> = [];

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
				regexTexts.push({ original: filter, regex: new RegExp(filter.slice(1, -1)) });
			} catch {
				// 無効な正規表現はスキップ
			}
		} else {
			normalTexts.push(filter);
		}
	}

	const ac = new AhoCorasick.default(normalTexts);

	return {
		normals: normalTexts,
		and: andTexts,
		regex: regexTexts,
		ahoCorasick: ac,
	};
}

function setWordMuteInfo(mutedWords: Array<string | string[]>, hardMutedWords: Array<string | string[]>): void {
	const soft = createWordMuteInfo(mutedWords);
	const hard = createWordMuteInfo(hardMutedWords);

	globalThis._misskeyWordMute = { soft, hard };
}

function getWordMuteInfo(): GlobalMisskeyWordMute | undefined {
	if (!globalThis._misskeyWordMute) return undefined;
	return globalThis._misskeyWordMute as unknown as GlobalMisskeyWordMute;
}

export function initWordMuteInfo(): void {
	const mutedWords = $i?.mutedWords ?? [];
	const hardMutedWords = $i?.hardMutedWords ?? [];

	setWordMuteInfo(mutedWords, hardMutedWords);
}

export function checkWordMute(
	note: Misskey.entities.Note,
	me: Misskey.entities.UserLite | null | undefined,
	type: 'soft' | 'hard',
): Array<string | string[]> | false {
	// 自分自身の投稿は対象外
	if (me && (note.userId === me.id)) return false;

	const wordMuteInfo = getWordMuteInfo()?.[type];

	if (wordMuteInfo == null || wordMuteInfo === false) return false;

	const text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();
	if (text === '') return false;

	const normalMatches = wordMuteInfo.ahoCorasick.search(text);

	// andTexts
	const andMatches = wordMuteInfo.and.filter(texts => texts.filter(keyword => keyword !== '').every(keyword => text.includes(keyword)));

	// RegExp
	const regexMatches = wordMuteInfo.regex.filter(({ regex }) => regex.test(text));

	const matched: Array<string | string[]> = normalMatches.map(match	=> match[1]).concat(andMatches, regexMatches.map(({ original }) => original));

	return matched.length > 0 ? matched : false;
}
