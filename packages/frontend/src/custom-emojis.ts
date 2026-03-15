/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, readonly } from 'vue';
import type { Ref, DeepReadonly } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi, misskeyApiGet } from '@/utility/misskey-api.js';
import { get, del } from '@/utility/idb-keyval.js';
import {
	setAllEmojis,
	addEmoji as addEmojiToStore,
	updateEmojis as updateEmojisInStore,
	removeEmojis as removeEmojisFromStore,
	getLastFetchedAt as getLastFetchedAtFromStore,
	setLastFetchedAt as setLastFetchedAtToStore,
	convertToV1Emoji,
	getEmojiCategories,
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
			await setAllEmojis(oldEmojis.map(convertToV1Emoji));

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
const customEmojiCategories = ref<[ ...string[], null ] | null>(null);
export async function getCustomEmojiCategories(): Promise<DeepReadonly<Ref<[ ...string[], null ]>>> {
	if (customEmojiCategories.value !== null) {
		return readonly(customEmojiCategories as Ref<[ ...string[], null ]>);
	} else {
		const categories = await getEmojiCategories();
		customEmojiCategories.value = [...categories, null];
		return readonly(customEmojiCategories as Ref<[ ...string[], null ]>);
	}
}

export async function addCustomEmoji(emoji: Misskey.entities.EmojiSimple) {
	await addEmojiToStore(convertToV1Emoji(emoji));
}

export async function updateCustomEmojis(emojis: Misskey.entities.EmojiSimple[]) {
	await updateEmojisInStore(emojis.map(convertToV1Emoji));
}

export async function removeCustomEmojis(emojis: Misskey.entities.EmojiSimple[]) {
	const emojiNames = emojis.map(emoji => emoji.name);
	await removeEmojisFromStore(emojiNames);
}

export async function fetchCustomEmojis(force = false) {
	const now = Date.now();

	let res: Misskey.entities.EmojisResponse;
	if (force) {
		res = await misskeyApi('emojis', {});
	} else {
		const lastFetchedAt = await getLastFetchedAtFromStore();
		if (lastFetchedAt && (now - lastFetchedAt) < 1000 * 60 * 60) return;
		res = await misskeyApiGet('emojis', {});
	}

	await setAllEmojis(res.emojis.map(convertToV1Emoji));
	await setLastFetchedAtToStore(now);
}
