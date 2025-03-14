/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiUrl } from '@@/js/config.js';
import { defaultMemoryStorage } from '@/memory-storage';
import { waiting } from '@/os.js';
import { unisonReload, reloadChannel } from '@/utility/unison-reload.js';
import { $i } from '@/i.js';

export async function signout() {
	if (!$i) return;

	// TODO: preferの自動バックアップがオンの場合、いろいろ消す前に強制バックアップ

	waiting();

	localStorage.clear();
	defaultMemoryStorage.clear();

	const idbPromises = ['MisskeyClient', 'keyval-store'].map((name, i, arr) => new Promise((res, rej) => {
		indexedDB.deleteDatabase(name);
	}));

	await Promise.all(idbPromises);

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
