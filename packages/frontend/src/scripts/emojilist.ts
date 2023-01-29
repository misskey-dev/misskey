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

const _indexByChar: { [name: string]: number } = {};
for (let i = 0; i < emojilist.length; i++) {
	const emo = emojilist[i];
	_indexByChar[emo.char] = i;
}

export function getEmojiName(char: string): string | undefined {
	const idx: number | undefined = _indexByChar[char];
	if (typeof idx === 'undefined') {
		return undefined;
	} else {
		return emojilist[idx].name;
	}
}
