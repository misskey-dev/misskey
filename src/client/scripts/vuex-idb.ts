/*
	This code is based on https://github.com/jakearchibald/idb-keyval/blob/master/idb-keyval.ts
	Copyright 2016, Jake Archibald
	Apache License, Version 2.0
	https://github.com/jakearchibald/idb-keyval/blob/master/LICENCE
*/

import * as deepcopy from 'deepcopy';

// 現在使用しているストアを列挙。
// storeストアは通常のstateの保存に使用し、残りはmodule
const persistStores = ['store', 'device', 'deviceUser', 'settings', 'instance'] as const;

/*
	バージョンを指定する
	データベースの構造が変化したらバージョンをひとつ上げ、
	onupgradeneededにアップデート処理を追加する
*/
const version = 1;

export type VuexPersistStore = typeof persistStores[number];

export class VuexPersistDB {
	readonly stores = persistStores;

	readonly _dbp: Promise<IDBDatabase>;

	constructor(dbName = 'vuex') {
		this._dbp = new Promise((resolve, reject) => {
			const openreq = indexedDB.open(dbName, version);
			openreq.onerror = () => reject(openreq.error);
			openreq.onsuccess = () => resolve(openreq.result);

			// First time setup: create an empty object store
			openreq.onupgradeneeded = ev => {
			/*// v3
				// openreq.result...
				// if (ev.oldVersion >= 2) return; */

			/*// v2
				// openreq.result...
				// if (ev.oldVersion >= 1) return; */

				// v1
				[
					'store',
					'device',
					'deviceUser',
					'settings',
					'instance'
				].map(name => openreq.result.createObjectStore(name));
			};
		});
	}

	_withIDBStore(type: IDBTransactionMode, store: VuexPersistStore, callback: ((store: IDBObjectStore) => void)): Promise<void> {
		return this._dbp.then(db => new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(store, type);
			transaction.oncomplete = () => resolve();
			transaction.onabort = transaction.onerror = () => reject(transaction.error);
			callback(transaction.objectStore(store));
		}));
	}

	openTransaction(storename, mode: IDBTransactionMode): Promise<IDBTransaction>{
		return this._dbp.then(db => db.transaction(storename, mode));
	}

	get<Type>(key: IDBValidKey, storename: VuexPersistStore): Promise<Type> {
		let req: IDBRequest;
		return this._withIDBStore('readonly', storename, store => {
			req = store.get(key);
		}).then(() => req.result);
	}

	set(key: IDBValidKey, value: any, storename: VuexPersistStore): Promise<void> {
		return this._withIDBStore('readwrite', storename, store => {
			store.put(value, key);
		});
	}

	entries(storename: VuexPersistStore): Promise<[IDBValidKey, unknown][]> {
		const entries: [IDBValidKey, unknown][] = [];

		return this._withIDBStore('readonly', storename, store => {
			store.openCursor().onsuccess = function () {
				if (!this.result) return;
				entries.push([this.result.key, this.result.value]);
				this.result.continue();
			};
		}).then(() => entries);
	}

	async bulkSet(map: [IDBValidKey, any][], storename: VuexPersistStore): Promise<void> {
		const tx = await this.openTransaction(storename, 'readwrite');
		const st = tx.objectStore(storename);
		for (const [key, value] of map) {
			// cloneできないデータは保存できないので、とりあえずdeepcopyで整える
			st.put(deepcopy(value), key);
		}
		return new Promise((resolve, reject) => {
			tx.oncomplete = () => resolve();
			tx.abort = tx.onerror = () => reject(tx.error);
		});
	}
}
