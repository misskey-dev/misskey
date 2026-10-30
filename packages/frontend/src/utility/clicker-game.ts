/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, computed } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';

type SaveData = {
	gameVersion: number;
	cookies: number;
	totalCookies: number;
	totalHandmadeCookies: number;
	clicked: number;
	achievements: any[];
	facilities: any[];
};

export const saveData = ref<SaveData>();
export const ready = computed(() => saveData.value != null);

let prev = '';

export async function load() {
	try {
		saveData.value = await misskeyApi('i/registry/get', {
			scope: ['clickerGame'],
			key: 'saveData',
		});
	} catch (err: any) {
		if (err.code === 'NO_SUCH_KEY') {
			saveData.value = {
				gameVersion: 2,
				cookies: 0,
				totalCookies: 0,
				totalHandmadeCookies: 0,
				clicked: 0,
				achievements: [],
				facilities: [],
			};
			save();
			return;
		}
		throw err;
	}
}

export async function save() {
	const current = JSON.stringify(saveData.value);
	if (current === prev) return;

	await misskeyApi('i/registry/set', {
		scope: ['clickerGame'],
		key: 'saveData',
		value: saveData.value,
	});

	prev = current;
}
