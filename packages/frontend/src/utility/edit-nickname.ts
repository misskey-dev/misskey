/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { entities } from 'misskey-js';
import { ref, watch } from 'vue';
import { prefer } from '@/preferences.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os';

// リアクティブなニックネーム状態
export const nicknameState = {
	enabled: ref(prefer.s.nicknameEnabled),
	map: ref({ ...prefer.s.nicknameMap }),
};

// ニックネームを取得する関数
export function getNicknameForUser(user: entities.User): string | null {
	if (!nicknameState.enabled.value) return null;
	return nicknameState.map.value[user.id] || null;
}

export async function editNickname(user: entities.User) {
	if (!nicknameState.enabled.value) return;
	const { result, canceled } = await os.inputText({
		title: i18n.ts.editNickname,
		placeholder: user.name || user.username,
		default: nicknameState.map.value[user.id] ?? null,
	});
	if (canceled) return;

	// 新しいマップを作成
	const newMap = { ...prefer.s.nicknameMap };
	if (result) {
		newMap[user.id] = result;
	} else {
		delete newMap[user.id];
	}

	// 即時反映のためにリアクティブな状態を更新
	nicknameState.map.value = { ...newMap };

	// 永続化
	await prefer.commit('nicknameMap', newMap);
}

// 設定変更の監視
// prefer.r を watch することで、別のUIから設定が変更された場合にも監視が発火する
// テスト環境では prefer.r が undefined の場合があるため、try-catchで囲む
try {
	watch(() => prefer.r.nicknameMap.value, (newMap) => {
		nicknameState.map.value = { ...newMap };
	});

	watch(() => prefer.r.nicknameEnabled.value, (newEnabled) => {
		nicknameState.enabled.value = newEnabled;
	});
} catch (err) {
	// テスト環境では prefer.r が存在しないため、エラーを無視
	console.debug('Failed to setup nickname preference watchers:', err);
}

// 初期化
nicknameState.enabled.value = prefer.s.nicknameEnabled;
nicknameState.map.value = { ...prefer.s.nicknameMap };
