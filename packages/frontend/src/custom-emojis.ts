import { api } from './os';
import { miLocalStorage } from './local-storage';

const storageCache = miLocalStorage.getItem('emojis');
export let customEmojis = storageCache ? JSON.parse(storageCache) : [];

fetchCustomEmojis();

export async function fetchCustomEmojis() {
	const now = Date.now();
	const lastFetchedAt = miLocalStorage.getItem('lastEmojisFetchedAt');
	if (lastFetchedAt && (now - parseInt(lastFetchedAt)) < 1000 * 60 * 60) return;

	const res = await api('emojis', {});

	customEmojis = res.emojis;
	miLocalStorage.setItem('emojis', JSON.stringify(customEmojis));
	miLocalStorage.setItem('lastEmojisFetchedAt', now.toString());
}

let cachedCategories;
export function getCustomEmojiCategories() {
	if (cachedCategories) return cachedCategories;

	const categories = new Set();
	for (const emoji of customEmojis) {
		categories.add(emoji.category);
	}
	const res = Array.from(categories);
	cachedCategories = res;
	return res;
}

let cachedTags;
export function getCustomEmojiTags() {
	if (cachedTags) return cachedTags;

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
