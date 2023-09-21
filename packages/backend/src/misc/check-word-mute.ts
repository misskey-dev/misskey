/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AhoCorasick } from 'slacc';
import RE2 from 're2';
import type { MiNote } from '@/models/Note.js';
import type { MiUser } from '@/models/User.js';

type NoteLike = {
	userId: MiNote['userId'];
	text: MiNote['text'];
	cw?: MiNote['cw'];
};

type UserLike = {
	id: MiUser['id'];
};

const acCache = new Map<string, AhoCorasick>();

export async function checkWordMute(note: NoteLike, me: UserLike | null | undefined, mutedWords: Array<string | string[]>): Promise<boolean> {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length > 0) {
		const text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();

		if (text === '') return false;

		const acable = mutedWords.filter(filter => Array.isArray(filter) && filter.length === 1).map(filter => filter[0]).sort();
		const unacable = mutedWords.filter(filter => !Array.isArray(filter) || filter.length !== 1);
		const acCacheKey = acable.join('\n');
		const ac = acCache.get(acCacheKey) ?? AhoCorasick.withPatterns(acable);
		acCache.delete(acCacheKey);
		for (const obsoleteKeys of acCache.keys()) {
			if (acCache.size > 1000) {
				acCache.delete(obsoleteKeys);
			}
		}
		acCache.set(acCacheKey, ac);
		if (ac.isMatch(text)) {
			return true;
		}

		const matched = unacable.some(filter => {
			if (Array.isArray(filter)) {
				return filter.every(keyword => text.includes(keyword));
			} else {
				// represents RegExp
				const regexp = filter.match(/^\/(.+)\/(.*)$/);

				// This should never happen due to input sanitisation.
				if (!regexp) return false;

				try {
					return new RE2(regexp[1], regexp[2]).test(text);
				} catch (err) {
					// This should never happen due to input sanitisation.
					return false;
				}
			}
		});

		if (matched) return true;
	}

	return false;
}
