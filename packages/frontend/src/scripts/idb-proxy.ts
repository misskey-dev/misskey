/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FirefoxのプライベートモードなどではindexedDBが使用不可能なので、
// indexedDBが使えない環境ではlocalStorageを使う
import {
	get as iget,
	set as iset,
	del as idel,
} from 'idb-keyval';

const fallbackName = (key: string) => `idbfallback::${key}`;

let idbAvailable = typeof window !== 'undefined' ? !!(window.indexedDB && window.indexedDB.open) : true;

// iframe.contentWindow.indexedDB.deleteDatabase() がchromeのバグで使用できないため、indexedDBを無効化している。
// バグが治って再度有効化するのであれば、cypressのコマンド内のコメントアウトを外すこと
// see https://github.com/misskey-dev/misskey/issues/13605#issuecomment-2053652123
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
if (window.Cypress) {
	idbAvailable = false;
	console.log('Cypress detected. It will use localStorage.');
}

if (idbAvailable) {
	await iset('idb-test', 'test')
		.catch(err => {
			console.error('idb error', err);
			console.error('indexedDB is unavailable. It will use localStorage.');
			idbAvailable = false;
		});
} else {
	console.error('indexedDB is unavailable. It will use localStorage.');
}

export async function get(key: string) {
	if (idbAvailable) return iget(key);
	return JSON.parse(window.localStorage.getItem(fallbackName(key)));
}

export async function set(key: string, val: any) {
	if (idbAvailable) return iset(key, val);
	return window.localStorage.setItem(fallbackName(key), JSON.stringify(val));
}

export async function del(key: string) {
	if (idbAvailable) return idel(key);
	return window.localStorage.removeItem(fallbackName(key));
}
