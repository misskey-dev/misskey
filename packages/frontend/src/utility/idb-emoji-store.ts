/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { openDB } from 'idb';
import type { IDBPDatabase, DBSchema } from 'idb';

const DB_NAME = 'misskey-emojis';
const STORE_NAME = 'emojis';
const DB_VERSION = 1;
export const CATEGORY_NONE = '__CATEGORY_NONE__';

export type V1Emoji = {
	aliases: string[];
	name: string;
	category: string | typeof CATEGORY_NONE;
	url: string;
	localOnly?: boolean | undefined;
	isSensitive?: boolean | undefined;
	roleIdsThatCanBeUsedThisEmojiAsReaction?: string[] | undefined;
};

type V1LastFetchedAt = {
	name: '__lastFetchedAt__';
	timestamp: number;
};

type V1Value = V1Emoji | V1LastFetchedAt;

interface DBV1Schema extends DBSchema {
	[STORE_NAME]: {
		key: string;
		value: V1Value;
		indexes: {
			category: string;
			aliases: string[];
		};
	};
}

type EmojiDB = IDBPDatabase<DBV1Schema>;

let db: EmojiDB | null = null;

export function convertToV1Emoji(emoji: Misskey.entities.EmojiSimple): V1Emoji {
	return {
		aliases: emoji.aliases,
		name: emoji.name,
		category: emoji.category ?? CATEGORY_NONE,
		url: emoji.url,
		localOnly: emoji.localOnly,
		isSensitive: emoji.isSensitive,
		roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction,
	};
}

export function convertToMisskeyEntityEmoji(emoji: V1Emoji): Misskey.entities.EmojiSimple {
	return {
		aliases: emoji.aliases,
		name: emoji.name,
		category: emoji.category === CATEGORY_NONE ? null : emoji.category,
		url: emoji.url,
		localOnly: emoji.localOnly,
		isSensitive: emoji.isSensitive,
		roleIdsThatCanBeUsedThisEmojiAsReaction: emoji.roleIdsThatCanBeUsedThisEmojiAsReaction,
	};
}

function isV1Emoji(value: V1Value): value is V1Emoji {
	return value.name !== '__lastFetchedAt__';
}

async function getDB(): Promise<EmojiDB> {
	if (db) return db;

	db = await openDB(DB_NAME, DB_VERSION, {
		upgrade(db, oldVersion) {
			if (oldVersion < 1) {
				// Create object store with 'name' as the key path
				const store = db.createObjectStore(STORE_NAME, { keyPath: 'name' });
				// Create index for category for efficient filtering
				store.createIndex('category', 'category', { unique: false });
				// Create index for aliases for efficient searching
				store.createIndex('aliases', 'aliases', { unique: false, multiEntry: true });
			}
		},
	});

	return db;
}

/**
 * Get all custom emojis from the dedicated store
 */
export async function getAllEmojis(): Promise<V1Emoji[]> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const emojis = await store.getAll();
		await tx.done;
		return emojis.filter(emoji => isV1Emoji(emoji));
	} catch (err) {
		console.error('Failed to get emojis from IndexedDB', err);
		return [];
	}
}

export async function getEmojiByName(name: string): Promise<V1Emoji | null> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const emoji = await store.get(name);
		await tx.done;

		if (!emoji || !isV1Emoji(emoji)) {
			return null;
		}

		return emoji;
	} catch (err) {
		console.error('Failed to get emoji from IndexedDB', err);
		return null;
	}
}

export async function getEmojisByCategory(category: string | typeof CATEGORY_NONE): Promise<V1Emoji[]> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const categoryIndex = store.index('category');

		const emojis = await categoryIndex.getAll(category);
		await tx.done;

		return emojis.filter(emoji => isV1Emoji(emoji));
	} catch (err) {
		console.error('Failed to get emojis by category from IndexedDB', err);
		return [];
	}
}

export async function searchEmojis(query: string, max = 12, exact = false): Promise<V1Emoji[]> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const aliasIndex = store.index('aliases');

		const matches = new Map<string, V1Emoji>();

		// 完全一致検索
		const exactMatch = await store.get(query);
		if (exactMatch && isV1Emoji(exactMatch)) {
			matches.set(exactMatch.name, exactMatch);
		}

		// エイリアスでの完全一致検索
		const aliasExactMatches = await aliasIndex.getAll(IDBKeyRange.only(query));
		for (const emoji of aliasExactMatches) {
			if (isV1Emoji(emoji)) {
				matches.set(emoji.name, emoji);
			}
		}

		if (matches.size >= max || exact) {
			await tx.done;
			return Array.from(matches.values()).slice(0, max);
		}

		if (query.includes(' ')) { // AND検索
			const keywords = query.split(' ');
			const cursor = await store.openCursor();
			while (cursor) {
				const emoji = cursor.value;
				if (
					isV1Emoji(emoji) &&
					keywords.every(keyword =>
						emoji.name.toLowerCase().includes(keyword.toLowerCase()) ||
						emoji.aliases.some(alias => alias.includes(keyword.toLowerCase()))
					)
				) {
					matches.set(emoji.name, emoji);
				}
				const end = await cursor.continue();
				if (!end || matches.size >= max) break;
			}
		} else {
			// 名前またはエイリアスで部分一致検索
			const cursor = await store.openCursor();
			while (cursor) {
				const emoji = cursor.value;
				if (
					isV1Emoji(emoji) &&
					(emoji.name.toLowerCase().includes(query.toLowerCase()) || emoji.aliases.some(alias => alias.toLowerCase().includes(query.toLowerCase())))
				) {
					matches.set(emoji.name, emoji);
				}
				const end = await cursor.continue();
				if (!end || matches.size >= max) break;
			}
		}

		await tx.done;
		return Array.from(matches.values());
	} catch (err) {
		console.error('Failed to search custom emojis in IndexedDB', err);
		return [];
	}
}

/**
 * Set all custom emojis to the dedicated store
 */
export async function setAllEmojis(emojis: V1Emoji[]): Promise<void> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);

		// Clear existing data
		await store.clear();

		// Insert all emojis
		for (const emoji of emojis) {
			await store.put(emoji);
		}

		await tx.done;
	} catch (err) {
		console.error('Failed to set emojis to IndexedDB', err);
		throw err;
	}
}

/**
 * Add a single emoji to the store
 */
export async function addEmoji(emoji: V1Emoji): Promise<void> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		await store.put(emoji);
		await tx.done;
	} catch (err) {
		console.error('Failed to add emoji to IndexedDB', err);
		throw err;
	}
}

/**
 * Update multiple emojis in the store
 */
export async function updateEmojis(emojis: V1Emoji[]): Promise<void> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);

		for (const emoji of emojis) {
			await store.put(emoji);
		}

		await tx.done;
	} catch (err) {
		console.error('Failed to update emojis in IndexedDB', err);
		throw err;
	}
}

/**
 * Remove multiple emojis from the store
 */
export async function removeEmojis(emojiNames: string[]): Promise<void> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);

		for (const name of emojiNames) {
			await store.delete(name);
		}

		await tx.done;
	} catch (err) {
		console.error('Failed to remove emojis from IndexedDB', err);
		throw err;
	}
}

/**
 * Get the last fetched timestamp for emojis
 */
export async function getLastFetchedAt(): Promise<number | null> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const value = await store.get('__lastFetchedAt__');
		await tx.done;
		if (value == null || isV1Emoji(value)) {
			return null;
		}

		return value.timestamp;
	} catch (err) {
		console.error('Failed to get lastFetchedAt from IndexedDB', err);
		return null;
	}
}

/**
 * Set the last fetched timestamp for emojis
 */
export async function setLastFetchedAt(timestamp: number): Promise<void> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		await store.put({ name: '__lastFetchedAt__', timestamp });
		await tx.done;
	} catch (err) {
		console.error('Failed to set lastFetchedAt to IndexedDB', err);
		throw err;
	}
}

/**
 * Get categories of custom emojis
 */
export async function getEmojiCategories(): Promise<string[]> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readonly');
		const store = tx.objectStore(STORE_NAME);
		const categoryIndex = store.index('category');

		const categoriesSet = new Set<string>();
		let cursor = await categoryIndex.openKeyCursor();

		while (cursor) {
			const category = cursor.key;
			if (category && typeof category === 'string') {
				categoriesSet.add(category);
			}
			cursor = await cursor.continue();
		}

		await tx.done;

		return Array.from(categoriesSet);
	} catch (err) {
		console.error('Failed to get emoji categories from IndexedDB', err);
		return [];
	}
}

/**
 * Clear all data from the emoji store
 */
export async function clearEmojiStore(): Promise<void> {
	try {
		const database = await getDB();
		const tx = database.transaction(STORE_NAME, 'readwrite');
		const store = tx.objectStore(STORE_NAME);
		await store.clear();
		await tx.done;
	} catch (err) {
		console.error('Failed to clear emoji store', err);
		throw err;
	}
}
