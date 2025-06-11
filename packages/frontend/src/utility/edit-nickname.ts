/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { entities } from 'misskey-js';
import { prefer } from '@/preferences.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os';
import { ref } from 'vue';

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
// prefer.commitは内部的にpreferのプロパティも更新するため、
// 別のUIから設定が変更された場合にもこの監視が発火する
const originalSet = prefer.set;
prefer.set = function (key, value) {
	// 元のメソッドを呼び出す
	const result = originalSet.call(this, key, value);

	// ニックネーム関連の設定が変更されたら状態を更新
	if (key === 'nicknameMap') {
		nicknameState.map.value = { ...value };
	} else if (key === 'nicknameEnabled') {
		nicknameState.enabled.value = value;
	}

	return result;
};

// 初期化
nicknameState.enabled.value = prefer.s.nicknameEnabled;
nicknameState.map.value = { ...prefer.s.nicknameMap };
