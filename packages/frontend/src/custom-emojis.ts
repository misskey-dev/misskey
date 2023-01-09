import { api } from './os';
import { miLocalStorage } from './local-storage';

const storageCache = miLocalStorage.getItem('emojis');
let cached = storageCache ? JSON.parse(storageCache) : null;
export async function getCustomEmojis() {
	const now = Date.now();
	const lastFetchedAt = miLocalStorage.getItem('lastEmojisFetchedAt');
	if (cached && lastFetchedAt && (now - parseInt(lastFetchedAt)) < 1000 * 60 * 60) return cached;

	const res = await api('emojis', {});

	cached = res.emojis;
	miLocalStorage.setItem('emojis', JSON.stringify(cached));
	miLocalStorage.setItem('lastEmojisFetchedAt', now.toString());
}

let cachedCategories;
export async function getCustomEmojiCategories() {
	if (cachedCategories) return cachedCategories;

	const customEmojis = await getCustomEmojis();

	const categories = new Set();
	for (const emoji of customEmojis) {
		categories.add(emoji.category);
	}
	const res = Array.from(categories);
	cachedCategories = res;
	return res;
}

let cachedTags;
export async function getCustomEmojiTags() {
	if (cachedTags) return cachedTags;

	const customEmojis = await getCustomEmojis();

	const tags = new Set();
	for (const emoji of customEmojis) {
		for (const tag of emoji.aliases) {
			tags.add(tag);
		}
	}
	const res = Array.from(tags);
	cachedTags = res;
	return res;
}
