/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { shallowRef, computed, markRaw, watch } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi, misskeyApiGet } from '@/utility/misskey-api.js';
import { get, del } from '@/utility/idb-keyval.js';
import {
	getAllEmojis,
	setAllEmojis,
	addEmoji as addEmojiToStore,
	updateEmojis as updateEmojisInStore,
	removeEmojis as removeEmojisFromStore,
	getLastFetchedAt as getLastFetchedAtFromStore,
	setLastFetchedAt as setLastFetchedAtToStore,
} from '@/utility/idb-emoji-store.js';

// Migration from old keyval store to new dedicated emoji store
async function migrateFromKeyvalStore(): Promise<Misskey.entities.EmojiSimple[]> {
	try {
		// Check if old data exists
		const oldEmojis = await get('emojis');
		const oldLastFetchedAt = await get('lastEmojisFetchedAt');

		if (Array.isArray(oldEmojis) && oldEmojis.length > 0) {
			if (_DEV_) console.log('Migrating emojis from keyval store to dedicated emoji store...');

			// Migrate emojis to new store
			await setAllEmojis(oldEmojis);

			// Migrate lastFetchedAt timestamp
			if (typeof oldLastFetchedAt === 'number') {
				await setLastFetchedAtToStore(oldLastFetchedAt);
			}

			// Clean up old data
			await del('emojis');
			await del('lastEmojisFetchedAt');

			if (_DEV_) console.log('Emoji: Migration completed successfully');
		}
	} catch (err) {
		console.error('Failed to migrate emojis from keyval store', err);
	}

	return [];
}

// Initialize emojis from the new dedicated store
const migratedEmojis = await migrateFromKeyvalStore();
const storageCache = migratedEmojis.length > 0 ? migratedEmojis : await getAllEmojis();
export const customEmojis = shallowRef<Misskey.entities.EmojiSimple[]>(Array.isArray(storageCache) ? storageCache : []);
export const customEmojiCategories = computed<[ ...string[], null ]>(() => {
	const categories = new Set<string>();
	for (const emoji of customEmojis.value) {
		if (emoji.category && emoji.category !== 'null') {
			categories.add(emoji.category);
		}
	}
	return markRaw([...Array.from(categories), null]);
});

export const customEmojisMap = new Map<string, Misskey.entities.EmojiSimple>();
watch(customEmojis, emojis => {
	customEmojisMap.clear();
	for (const emoji of emojis) {
		customEmojisMap.set(emoji.name, emoji);
	}
}, { immediate: true });

export async function addCustomEmoji(emoji: Misskey.entities.EmojiSimple) {
	customEmojis.value = [emoji, ...customEmojis.value];
	await addEmojiToStore(emoji);
}

export async function updateCustomEmojis(emojis: Misskey.entities.EmojiSimple[]) {
	customEmojis.value = customEmojis.value.map(item => emojis.find(search => search.name === item.name) ?? item);
	await updateEmojisInStore(emojis);
}

export async function removeCustomEmojis(emojis: Misskey.entities.EmojiSimple[]) {
	customEmojis.value = customEmojis.value.filter(item => !emojis.some(search => search.name === item.name));
	const emojiNames = emojis.map(emoji => emoji.name);
	await removeEmojisFromStore(emojiNames);
}

export async function fetchCustomEmojis(force = false) {
	const now = Date.now();

	let res;
	if (force) {
		res = await misskeyApi('emojis', {});
	} else {
		const lastFetchedAt = await getLastFetchedAtFromStore();
		if (lastFetchedAt && (now - lastFetchedAt) < 1000 * 60 * 60) return;
		res = await misskeyApiGet('emojis', {});
	}

	customEmojis.value = res.emojis;
	await setAllEmojis(res.emojis);
	await setLastFetchedAtToStore(now);
}
