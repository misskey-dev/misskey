export const unicodeEmojiCategories = ['face', 'people', 'animals_and_nature', 'food_and_drink', 'activity', 'travel_and_places', 'objects', 'symbols', 'flags'] as const;

export type UnicodeEmojiDef = {
	name: string;
	keywords: string[];
	char: string;
	category: typeof unicodeEmojiCategories[number];
}

// initial converted from https://github.com/muan/emojilib/commit/242fe68be86ed6536843b83f7e32f376468b38fb
import _emojilist from '../emojilist.json';

export const emojilist = _emojilist as UnicodeEmojiDef[];

const _indexByChar = new Map<string, number>();
const _charGroupByCategory = new Map<string, string[]>();
emojilist.forEach((emo, i) => {
	_indexByChar.set(emo.char, i);

	if (_charGroupByCategory.has(emo.category)) {
		_charGroupByCategory.get(emo.category)?.push(emo.char);
	} else {
		_charGroupByCategory.set(emo.category, [emo.char]);
	}
});

export const emojiCharByCategory = _charGroupByCategory;

export function getEmojiName(char: string): string | undefined {
	const idx = _indexByChar.get(char);
	if (typeof idx === 'undefined') {
		return undefined;
	} else {
		return emojilist[idx].name;
	}
}
