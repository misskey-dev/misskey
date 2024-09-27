/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, reactive } from 'vue';
import * as Misskey from 'misskey-js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { miLocalStorage } from '@/local-storage.js';
import { DEFAULT_INFO_IMAGE_URL, DEFAULT_NOT_FOUND_IMAGE_URL, DEFAULT_SERVER_ERROR_IMAGE_URL } from '@@/js/const.js';

// TODO: 他のタブと永続化されたstateを同期

//#region loader
const providedMetaEl = document.getElementById('misskey_meta');

let cachedMeta = miLocalStorage.getItem('instance') ? JSON.parse(miLocalStorage.getItem('instance')!) : null;
let cachedAt = miLocalStorage.getItem('instanceCachedAt') ? parseInt(miLocalStorage.getItem('instanceCachedAt')!) : 0;
const providedMeta = providedMetaEl && providedMetaEl.textContent ? JSON.parse(providedMetaEl.textContent) : null;
const providedAt = providedMetaEl && providedMetaEl.dataset.generatedAt ? parseInt(providedMetaEl.dataset.generatedAt) : 0;
if (providedAt > cachedAt) {
	miLocalStorage.setItem('instance', JSON.stringify(providedMeta));
	miLocalStorage.setItem('instanceCachedAt', providedAt.toString());
	cachedMeta = providedMeta;
	cachedAt = providedAt;
}
//#endregion

// TODO: instanceをリアクティブにするかは再考の余地あり

export const instance: Misskey.entities.MetaDetailed = reactive(cachedMeta ?? {});

export const serverErrorImageUrl = computed(() => instance.serverErrorImageUrl ?? DEFAULT_SERVER_ERROR_IMAGE_URL);

export const infoImageUrl = computed(() => instance.infoImageUrl ?? DEFAULT_INFO_IMAGE_URL);

export const notFoundImageUrl = computed(() => instance.notFoundImageUrl ?? DEFAULT_NOT_FOUND_IMAGE_URL);

export const isEnabledUrlPreview = computed(() => instance.enableUrlPreview ?? true);

export async function fetchInstance(force = false): Promise<Misskey.entities.MetaDetailed> {
	if (!force) {
		const cachedAt = miLocalStorage.getItem('instanceCachedAt') ? parseInt(miLocalStorage.getItem('instanceCachedAt')!) : 0;

		if (Date.now() - cachedAt < 1000 * 60 * 60) {
			return instance;
		}
	}

	const meta = await misskeyApi('meta', {
		detail: true,
	});

	for (const [k, v] of Object.entries(meta)) {
		instance[k] = v;
	}

	miLocalStorage.setItem('instance', JSON.stringify(instance));
	miLocalStorage.setItem('instanceCachedAt', Date.now().toString());

	return instance;
}
