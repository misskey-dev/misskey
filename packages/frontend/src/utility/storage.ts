/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref, shallowRef, watch, defineAsyncComponent } from 'vue';
import * as os from '@/os.js';
import { store } from '@/store.js';
import { i18n } from '@/i18n.js';

export const storagePersisted = ref(await navigator.storage.persisted());

export async function enableStoragePersistence() {
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
