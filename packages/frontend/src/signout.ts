/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, ref } from 'vue';
import { apiUrl, host } from '@@/js/config.js';
import { defaultMemoryStorage } from '@/memory-storage';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { waiting, popup, popupMenu, success, alert } from '@/os.js';
import { unisonReload, reloadChannel } from '@/utility/unison-reload.js';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';
import { $i } from '@/i.js';

export async function signout() {
	if (!$i) return;

	defaultMemoryStorage.clear();

	waiting();
	miLocalStorage.removeItem('account');

	// TODO: preferencesも削除

	//#region Remove service worker registration
	try {
		if (navigator.serviceWorker.controller) {
			const registration = await navigator.serviceWorker.ready;
			const push = await registration.pushManager.getSubscription();
			if (push) {
				await window.fetch(`${apiUrl}/sw/unregister`, {
					method: 'POST',
					body: JSON.stringify({
						i: $i.token,
						endpoint: push.endpoint,
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				});
			}
		}

		await navigator.serviceWorker.getRegistrations()
			.then(registrations => {
				return Promise.all(registrations.map(registration => registration.unregister()));
			});
	} catch (err) {}
	//#endregion

	unisonReload('/');
}
