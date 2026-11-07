/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * itemsの中でkey関数が返す値が重複しないようにした配列を返す
 * @param items 重複を除去したい配列
 * @param key 重複判定に使うキーを返す関数
 * @returns 重複を除去した配列
 */
export function uniqueByKey<TItem, TKey = string>(items: Iterable<TItem>, key: (item: TItem) => TKey): TItem[] {
	const map = new Map<TKey, TItem>();
	for (const item of items) {
		const k = key(item);
		if (!map.has(k)) {
			map.set(k, item);
		}
	}
	return [...map.values()];
}
