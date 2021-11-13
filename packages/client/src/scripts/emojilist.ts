// initial converted from https://github.com/muan/emojilib/commit/242fe68be86ed6536843b83f7e32f376468b38fb
export const emojilist = require('../emojilist.json') as {
	name: string;
	keywords: string[];
	char: string;
	category: 'people' | 'animals_and_nature' | 'food_and_drink' | 'activity' | 'travel_and_places' | 'objects' | 'symbols' | 'flags';
}[];
