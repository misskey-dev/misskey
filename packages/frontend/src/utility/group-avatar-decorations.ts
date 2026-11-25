/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { versatileLang } from '@@/js/intl-const.js';

type AvatarDecorationBase = { category?: string | null | undefined };

/**
 * アバターデコレーションをカテゴリごとにグループ化します。
 * @param decorations アバターデコレーションの配列
 * @returns カテゴリごとにグループ化されたアバターデコレーションオブジェクト
 */
export function groupAvatarDecorations<T extends AvatarDecorationBase>(decorations: T[]) {
	const grouped: Record<string, T[]> = {};

	for (const decoration of decorations) {
		const category = decoration.category ?? '';
		if (!(category in grouped)) {
			grouped[category] = [];
		}
		grouped[category].push(decoration);
	}

	return grouped;
}

/**
 * アバターデコレーションのカテゴリ名を表示順にソートします。
 * 数字を含むカテゴリ名は数値として比較し（例: `2.` → `10.`）、未分類（空文字）は最後にします。
 * @param categories カテゴリ名の配列
 * @returns ソートされたカテゴリ名の新しい配列
 */
export function sortAvatarDecorationCategories(categories: string[]) {
	return [...categories].sort((a, b) => {
		if (a === b) return 0;
		if (a === '') return 1;
		if (b === '') return -1;
		return a.localeCompare(b, versatileLang, { numeric: true });
	});
}
