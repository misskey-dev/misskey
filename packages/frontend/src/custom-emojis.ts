import { shallowRef, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { api, apiGet } from './os';
import { miLocalStorage } from './local-storage';
import { stream } from '@/stream';

const storageCache = miLocalStorage.getItem('emojis');
export const customEmojis = shallowRef<Misskey.entities.CustomEmoji[]>(storageCache ? JSON.parse(storageCache) : []);
export const customEmojiCategories = computed<[ ...string[], null ]>(() => {
	const categories = new Set<string>();
	for (const emoji of customEmojis.value) {
		if (emoji.category && emoji.category !== 'null') {
			categories.add(emoji.category);
		}
	}
	return markRaw([...Array.from(categories), null]);
});

stream.on('emojiAdded', emojiData => {
	customEmojis.value = [emojiData.emoji, ...customEmojis.value];
});

stream.on('emojiUpdated', emojiData => {
	customEmojis.value = customEmojis.value.map(item => emojiData.emojis.find(search => search.name === item.name) as Misskey.entities.CustomEmoji ?? item);
});

stream.on('emojiDeleted', emojiData => {
	customEmojis.value = customEmojis.value.filter(item => !emojiData.emojis.some(search => search.name === item.name));
});

export async function fetchCustomEmojis(force = false) {
	const now = Date.now();

	let res;
	if (force) {
		res = await api('emojis', {});
	} else {
		const lastFetchedAt = miLocalStorage.getItem('lastEmojisFetchedAt');
		if (lastFetchedAt && (now - parseInt(lastFetchedAt)) < 1000 * 60 * 60) return;
		res = await apiGet('emojis', {});
	}

	customEmojis.value = res.emojis;
	miLocalStorage.setItem('emojis', JSON.stringify(res.emojis));
	miLocalStorage.setItem('lastEmojisFetchedAt', now.toString());
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
