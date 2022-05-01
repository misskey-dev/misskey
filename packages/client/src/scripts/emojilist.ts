export const unicodeEmojiCategories = ['face', 'people', 'animals_and_nature', 'food_and_drink', 'activity', 'travel_and_places', 'objects', 'symbols', 'flags'] as const;

export type UnicodeEmojiDef = {
	name: string;
	keywords: string[];
	char: string;
	category: typeof unicodeEmojiCategories[number];
}

// initial converted from https://github.com/muan/emojilib/commit/242fe68be86ed6536843b83f7e32f376468b38fb
export const emojilist = (await import('../emojilist.json')).default as UnicodeEmojiDef[];
