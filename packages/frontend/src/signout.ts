/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { apiUrl } from '@@/js/config.js';
import { cloudBackup } from '@/preferences/utility.js';
import { removeAccount, login } from '@/accounts.js';
import { host } from '@@/js/config.js';
import { store } from '@/store.js';
import { prefer } from '@/preferences.js';
import { waiting } from '@/os.js';
import { unisonReload } from '@/utility/unison-reload.js';
import { clear } from '@/utility/idb-proxy.js';
import { $i } from '@/i.js';

/** クライアントに保存しているすべてのデータを削除します。 */
async function removeAllData() {
	if ($i == null) return;

	localStorage.clear();

	const idbAbortController = new AbortController();
	const timeout = window.setTimeout(() => idbAbortController.abort(), 5000);

	const idbPromises = ['MisskeyClient'].map((name, i, arr) => new Promise<void>((res, rej) => {
		const delidb = indexedDB.deleteDatabase(name);
		delidb.onsuccess = () => res();
		delidb.onerror = e => rej(e);
		delidb.onblocked = () => idbAbortController.signal.aborted && rej(new Error('Operation aborted'));
	}));

	try {
		await Promise.race([
			Promise.all([
				...idbPromises,
				// idb keyval-storeはidb-keyvalライブラリによる別管理
				clear(),
			]),
			new Promise((_, rej) => idbAbortController.signal.addEventListener('abort', () => rej(new Error('Operation timed out')))),
		]);
	} catch {
		// nothing
	} finally {
		window.clearTimeout(timeout);
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
	} catch {
		// nothing
	}
	//#endregion
}

/** 現在のアカウントに関連するデータを削除します。 */
async function removeCurrentAccountData() {
	if ($i == null) return;

	// 設定・状態を削除
	prefer.clearAccountSettingsFromDevice();
	await store.clearAccountDataFromDevice();
}

/**
 * アカウントからログアウトし、そのアカウントに関するデータを削除します。
 * @param all すべてのアカウントからログアウトするか？
 */
export async function signout(all = false) {
	if (!$i) return;

	const currentAccountId = $i.id;

	waiting();

	if (store.s.enablePreferencesAutoCloudBackup) {
		await cloudBackup();
	}

	if (prefer.s.accounts.length <= 1 || all) {
		// 最後のアカウントを削除する場合・全てのアカウントからログアウトする場合は全データ削除
		await removeAllData();
	} else {
		// 複数アカウントある場合は現在のアカウントのデータのみ削除
		await removeCurrentAccountData();

		// 現在のアカウント情報を削除
		await removeAccount(host, $i.id);

		// アカウント切り替え
		const nextAccountToken = Object.entries(store.s.accountTokens).find(([key, _]) => {
			const [accountHost, userId] = key.split('/');
			return accountHost === host && userId !== currentAccountId;
		})?.[1];

		if (nextAccountToken != null) {
			// ログインの際の遷移の挙動はlogin関数内で行うのでここではunisonReloadを呼ばず終了
			await login(nextAccountToken, undefined, false);
			return;
		} else {
			// 現時点では外部ホストのアカウントをログインさせることはできないので、
			// 通常の全アカウントからのログアウトと同様に扱う（全データ削除）
			await removeAllData();
		}
	}

	unisonReload('/');
}
