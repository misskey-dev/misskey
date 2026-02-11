/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';

type AvatarDecoration = Misskey.entities.GetAvatarDecorationsResponse[number];

/**
 * アバターデコレーションをカテゴリごとにグループ化します。
 * @param decorations アバターデコレーションの配列
 * @returns カテゴリごとにグループ化されたアバターデコレーションオブジェクト
 */
export function groupAvatarDecorations(decorations: AvatarDecoration[]) {
	const grouped: Record<string, AvatarDecoration[]> = {};

	for (const decoration of decorations) {
		const category = decoration.category ?? '';
		if (!(category in grouped)) {
			grouped[category] = [];
		}
		grouped[category].push(decoration);
	}

	return grouped;
}
