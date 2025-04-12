/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiUrl } from '@@/js/config.js';
import { cloudBackup } from '@/preferences/utility.js';
import { store } from '@/store.js';
import { waiting } from '@/os.js';
import { unisonReload } from '@/utility/unison-reload.js';
import { $i } from '@/i.js';

export async function signout() {
	if (!$i) return;

	waiting();

	if (store.s.enablePreferencesAutoCloudBackup) {
		await cloudBackup();

		localStorage.clear();

		const idbPromises = ['MisskeyClient', 'keyval-store'].map((name, i, arr) => new Promise<void>((res, rej) => {
			const delidb = indexedDB.deleteDatabase(name);
			delidb.onsuccess = () => res();
			delidb.onerror = e => rej(e);
		}));

		await Promise.all(idbPromises);
	}

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
