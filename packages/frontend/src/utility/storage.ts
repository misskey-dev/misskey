/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref } from 'vue';
import * as os from '@/os.js';
import { store } from '@/store.js';
import { i18n } from '@/i18n.js';

export const storagePersistenceSupported = window.isSecureContext && 'storage' in navigator;
export const storagePersisted = ref(storagePersistenceSupported ? await navigator.storage.persisted() : false);

export async function enableStoragePersistence() {
	if (!storagePersistenceSupported) return;
	try {
		const persisted = await navigator.storage.persist();
		if (persisted) {
			storagePersisted.value = true;
		} else {
			os.alert({
				type: 'error',
				text: i18n.ts.somethingHappened,
			});
		}
	}	catch (err) {
		os.alert({
			type: 'error',
			text: i18n.ts.somethingHappened,
		});
	}
}

export function skipStoragePersistence() {
	store.set('showStoragePersistenceSuggestion', false);
}
