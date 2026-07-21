/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { shallowRef, computed, markRaw } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { get, set } from '@/utility/idb-proxy.js';

const storageCache = await get('emojis');
export const isInitialLoading = !Array.isArray(storageCache);
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

// customEmojis が shallowRef なので問題ないが、そうでなくなった場合は値の変化で computed が乱発される可能性があるので要注意
export const customEmojisMap = computed(() => {
	const map = new Map<string, Misskey.entities.EmojiSimple>();
	for (const emoji of customEmojis.value) {
		map.set(emoji.name, emoji);
	}
	return markRaw(map);
});

let cachedTags: string[] | null = null;

function setCustomEmojis(emojis: Misskey.entities.EmojiSimple[]) {
	customEmojis.value = emojis;
	cachedTags = null;
	set('emojis', emojis);
}

type CustomEmojisMutation = (emojis: Misskey.entities.EmojiSimple[]) => Misskey.entities.EmojiSimple[];

/**
 * fetchCustomEmojis が絵文字リストを取得している間に届いたストリーム経由の更新を記録しておくバッファ
 * 取得していない間は null。
 */
let mutationsDuringFetch: CustomEmojisMutation[] | null = null;

function mutateCustomEmojis(mutation: CustomEmojisMutation) {
	mutationsDuringFetch?.push(mutation);
	setCustomEmojis(mutation(customEmojis.value));
}

export function addCustomEmoji(emoji: Misskey.entities.EmojiSimple) {
	mutateCustomEmojis(current => [emoji, ...current]);
}

export function updateCustomEmojis(emojis: Misskey.entities.EmojiSimple[]) {
	mutateCustomEmojis(current => current.map(item => emojis.find(search => search.name === item.name) ?? item));
}

export function removeCustomEmojis(emojis: Misskey.entities.EmojiSimple[]) {
	mutateCustomEmojis(current => current.filter(item => !emojis.some(search => search.name === item.name)));
}

function isSameStats(a: Misskey.entities.EmojisStatsResponse | null | undefined, b: Misskey.entities.EmojisStatsResponse) {
	// lastUpdatedAt はサーバー時刻の巻き戻しや古い updatedAt のまま復元する操作で単調増加とは限らないため大小比較ではいけない
	return a != null && a.count === b.count && a.lastUpdatedAt === b.lastUpdatedAt;
}

export async function fetchCustomEmojis(force = false) {
	const stats = await misskeyApi('emojis/stats');
	if (!force && isSameStats(await get('emojisStats'), stats)) return;

	// 取得中にストリーム経由で届いた更新
	const mutations: CustomEmojisMutation[] = [];
	mutationsDuringFetch = mutations;

	try {
		// GETだとキャッシュで古いリストが返ってきうるのでPOST
		const res = await misskeyApi('emojis');

		// 取得中に届いた更新は取得結果より新しいので、取得したリストに改めて適用する
		// そのまま上書きしてしまうと、その間に追加された絵文字が次回起動まで消えてしまう
		setCustomEmojis(mutations.reduce((emojis, mutation) => mutation(emojis), res.emojis));
		set('emojisStats', stats);
	} finally {
		mutationsDuringFetch = null;
	}
}

export function getCustomEmojiTags() {
	if (cachedTags) return cachedTags;

	const tags = new Set<string>();
	for (const emoji of customEmojis.value) {
		for (const tag of emoji.aliases) {
			tags.add(tag);
		}
	}
	const res = Array.from(tags);
	cachedTags = res;
	return res;
}
