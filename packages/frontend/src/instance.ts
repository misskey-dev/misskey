/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, reactive } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { miLocalStorage } from '@/local-storage.js';
import { DEFAULT_INFO_IMAGE_URL, DEFAULT_NOT_FOUND_IMAGE_URL, DEFAULT_SERVER_ERROR_IMAGE_URL } from '@/const.js';

// TODO: 他のタブと永続化されたstateを同期

const cached = miLocalStorage.getItem('instance');

// TODO: instanceをリアクティブにするかは再考の余地あり

export const instance: Misskey.entities.MetaResponse = reactive(cached ? JSON.parse(cached) : {
	// TODO: set default values
});

export const serverErrorImageUrl = computed(() => instance.serverErrorImageUrl ?? DEFAULT_SERVER_ERROR_IMAGE_URL);

export const infoImageUrl = computed(() => instance.infoImageUrl ?? DEFAULT_INFO_IMAGE_URL);

export const notFoundImageUrl = computed(() => instance.notFoundImageUrl ?? DEFAULT_NOT_FOUND_IMAGE_URL);

export async function fetchInstance(initial = false) {
	const el = document.getElementById('misskey_meta');

	let meta;
	if (initial && el && el.textContent) {
		try {
			const now = new Date();
			// 半日以内のデータならキャッシュを使う
			if (el.dataset.generatedAt && now.getTime() - new Date(el.dataset.generatedAt).getTime() < 1000 * 60 * 60 * 12) {
				meta = JSON.parse(el.textContent);
			} else {
				throw new Error('[meta] Metadata is too old. Fallback to API');
			}
		} catch (err) {
			console.error(err);

			// 取れなかったらAPIから取得
			meta = await misskeyApi('meta', {
				detail: false,
			});
		}
	} else {
		meta = await misskeyApi('meta', {
			detail: false,
		});
	}

	for (const [k, v] of Object.entries(meta)) {
		instance[k] = v;
	}

	miLocalStorage.setItem('instance', JSON.stringify(instance));
}
