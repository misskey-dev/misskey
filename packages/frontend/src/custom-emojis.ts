import { apiGet } from './os';
import { miLocalStorage } from './local-storage';
import { shallowRef } from 'vue';
import * as Misskey from 'misskey-js';

const storageCache = miLocalStorage.getItem('emojis');
export const customEmojis = shallowRef<Misskey.entities.CustomEmoji[]>(storageCache ? JSON.parse(storageCache) : []);

window.setInterval(fetchCustomEmojis, 1000 * 60 * 10);

export async function fetchCustomEmojis() {
	const now = Date.now();
	const lastFetchedAt = miLocalStorage.getItem('lastEmojisFetchedAt');
	if (lastFetchedAt && (now - parseInt(lastFetchedAt)) < 1000 * 60) return;

	const res = await apiGet('emojis', {});

	customEmojis.value = res.emojis;
	miLocalStorage.setItem('emojis', JSON.stringify(res.emojis));
	miLocalStorage.setItem('lastEmojisFetchedAt', now.toString());
}

let cachedCategories;
export function getCustomEmojiCategories() {
	if (cachedCategories) return cachedCategories;

	const categories = new Set();
	for (const emoji of customEmojis.value) {
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
	for (const emoji of customEmojis.value) {
		for (const tag of emoji.aliases) {
			tags.add(tag);
		}
	}
	const res = Array.from(tags);
	cachedTags = res;
	return res;
}
