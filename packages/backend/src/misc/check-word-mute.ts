import { Slacc } from '@misskey-dev/slacc';
import RE2 from 're2';
import type { Note } from '@/models/entities/Note.js';
import type { User } from '@/models/entities/User.js';

type NoteLike = {
	userId: Note['userId'];
	text: Note['text'];
	cw?: Note['cw'];
};

type UserLike = {
	id: User['id'];
};

const slaccCache = new Map<string, Slacc>();

export async function checkWordMute(note: NoteLike, me: UserLike | null | undefined, mutedWords: Array<string | string[]>): Promise<boolean> {
	// 自分自身
	if (me && (note.userId === me.id)) return false;

	if (mutedWords.length > 0) {
		const text = ((note.cw ?? '') + '\n' + (note.text ?? '')).trim();

		if (text === '') return false;

		const slaccable = mutedWords.filter(filter => Array.isArray(filter) && filter.length === 1).map(filter => filter[0]).sort();
		const unslaccable = mutedWords.filter(filter => !Array.isArray(filter) || filter.length !== 1);
		const slaccCacheKey = slaccable.join('\n');
		const slacc = slaccCache.get(slaccCacheKey) ?? Slacc.withPatterns(slaccable);
		slaccCache.delete(slaccCacheKey);
		for (const obsoleteKeys of slaccCache.keys()) {
			if (slaccCache.size > 1000) {
				slaccCache.delete(obsoleteKeys);
			}
		}
		slaccCache.set(slaccCacheKey, slacc);
		if (slacc.isMatch(text)) {
			return true;
		}

		const matched = unslaccable.some(filter => {
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
