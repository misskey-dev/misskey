/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { entities } from 'misskey-js';
import { prefer } from '@/preferences.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os';

export async function editNickname(user: entities.User) {
	if (!prefer.s.nicknameEnabled) return;
	const { result, canceled } = await os.inputText({
		title: i18n.ts.editNickname,
		placeholder: user.name || user.username,
		default: prefer.s.nicknameMap?.[user.id] ?? null,
	});
	if (canceled) return;
	const newMap = { ...prefer.s.nicknameMap };
	if (result) {
		newMap[user.id] = result;
	} else {
		delete newMap[user.id];
	}
	await prefer.commit('nicknameMap', newMap);
}
