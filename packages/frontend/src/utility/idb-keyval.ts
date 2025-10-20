/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FirefoxのプライベートモードなどではindexedDBが使用不可能なので、
// indexedDBが使えない環境ではlocalStorageを使う
import { openDB } from 'idb';
import type { IDBPDatabase } from 'idb';
import { miLocalStorage } from '@/local-storage.js';

const PREFIX = 'idbfallback::';

let idbAvailable = typeof window !== 'undefined' ? !!(window.indexedDB && typeof window.indexedDB.open === 'function') : true;
let db: IDBPDatabase | null = null;

async function getDB() {
	if (db) return db;
	db = await openDB('keyval-store', 1, {
		upgrade(db) {
			db.createObjectStore('keyval');
		},
	});
	return db;
}

async function iset(key: string, val: any) {
	const database = await getDB();
	const tx = database.transaction('keyval', 'readwrite');
	const store = tx.objectStore('keyval');
	await store.put(val, key);
	await tx.done;
}

async function iget(key: string) {
	const database = await getDB();
	const tx = database.transaction('keyval', 'readonly');
	const store = tx.objectStore('keyval');
	const val = await store.get(key);
	await tx.done;
	return val;
}

async function idel(key: string) {
	const database = await getDB();
	const tx = database.transaction('keyval', 'readwrite');
	const store = tx.objectStore('keyval');
	await store.delete(key);
	await tx.done;
}

async function iclear() {
	const database = await getDB();
	const tx = database.transaction('keyval', 'readwrite');
	const store = tx.objectStore('keyval');
	await store.clear();
	await tx.done;
}

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
	return miLocalStorage.getItemAsJson(`${PREFIX}${key}`);
}

export async function set(key: string, val: any) {
	if (idbAvailable) return iset(key, val);
	return miLocalStorage.setItemAsJson(`${PREFIX}${key}`, val);
}

export async function del(key: string) {
	if (idbAvailable) return idel(key);
	return miLocalStorage.removeItem(`${PREFIX}${key}`);
}

export async function clear() {
	if (idbAvailable) return iclear();
}
