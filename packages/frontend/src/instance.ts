/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, reactive } from 'vue';
import * as Misskey from 'misskey-js';
import { api } from '@/os.js';
import { miLocalStorage } from '@/local-storage.js';
import { DEFAULT_INFO_IMAGE_URL, DEFAULT_NOT_FOUND_IMAGE_URL, DEFAULT_SERVER_ERROR_IMAGE_URL } from '@/const.js';

// TODO: 他のタブと永続化されたstateを同期

const cached = miLocalStorage.getItem('instance');

// TODO: instanceをリアクティブにするかは再考の余地あり

export const instance: Misskey.entities.InstanceMetadata = reactive(cached ? JSON.parse(cached) : {
	// TODO: set default values
});

export const serverErrorImageUrl = computed(() => instance.serverErrorImageUrl ?? DEFAULT_SERVER_ERROR_IMAGE_URL);

export const infoImageUrl = computed(() => instance.infoImageUrl ?? DEFAULT_INFO_IMAGE_URL);

export const notFoundImageUrl = computed(() => instance.notFoundImageUrl ?? DEFAULT_NOT_FOUND_IMAGE_URL);

export async function fetchInstance() {
	const meta = await api('meta', {
		detail: false,
	});

	for (const [k, v] of Object.entries(meta)) {
		instance[k] = v;
	}

	miLocalStorage.setItem('instance', JSON.stringify(instance));
}
