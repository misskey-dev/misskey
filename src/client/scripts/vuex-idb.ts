/*
	This code is based on https://github.com/jakearchibald/idb-keyval/blob/master/idb-keyval.ts
	Copyright 2016, Jake Archibald
	Apache License, Version 2.0
	https://github.com/jakearchibald/idb-keyval/blob/master/LICENCE
*/

import * as deepcopy from 'deepcopy';

export class VuexPersistDB<S extends ['store', ...M[]], M extends string> {
	public dbName: string;
	public stores: S; // もしくは [] （真面目に型定義すると面倒臭いことになる）
	public _dbp: Promise<IDBDatabase>;

	constructor(dbName = 'vuex') {
		this.dbName = dbName;

		this._dbp = new Promise((resolve, reject) => {
			const openreq = indexedDB.open(dbName);
			openreq.onerror = () => reject(openreq.error);
			openreq.onsuccess = () => {
				this.stores = Array.from(openreq.result.objectStoreNames) as S;
				resolve(openreq.result);
			};
		});
	}

	/**
	 * データベースを初期化・アップデートします
	 * @param moduleStore 永続化したいvuexモジュールを列挙
	 * @param version indexedDBのバージョン。moduleStoreを変更するたびにインクリメントしてください！
	 */
	public async update(moduleStores: M[], version: number): Promise<'noUpdate' | 'updated' | 'initialized'> {
		let updateState: 'noUpdate' | 'updated' | 'initialized' = 'noUpdate';

		this._dbp = new Promise((resolve, reject) => {
			const openreq = indexedDB.open(this.dbName, version);

			openreq.onerror = () => reject(openreq.error);

			// First time setup: create an empty object store
			openreq.onupgradeneeded = async ev => {
				// ストアが空の場合
				if (this.stores.length === 0) {
					updateState = 'initialized';
					['store', ...moduleStores].map(name => openreq.result.createObjectStore(name));
					return resolve(openreq.result);
				}

				// ストアがすでにある場合、アップデートする
				updateState = 'updated';

				// 既存のモジュールストア
				const currentModuleStores = Array.from(openreq.result.objectStoreNames).filter(v => v !== 'store');

				// 古いストアを削除
				await Promise.all(currentModuleStores
					.filter(v => !(moduleStores as string[]).includes(v))
					.map(name => {
						return new Promise((resolve, reject) => {
							const transaction = openreq.result.transaction(name, 'readwrite');
							transaction.oncomplete = () => resolve();
							transaction.onabort = transaction.onerror = () => reject(transaction.error);
							transaction.objectStore(name).clear();
						});
					})
				);

				// 存在しないストアを作成
				moduleStores
					.filter(v => !currentModuleStores.includes(v))
					.map(name => openreq.result.createObjectStore(name));

				return resolve(openreq.result);
			};

			openreq.onsuccess = () => updateState === 'noUpdate' && resolve(openreq.result);
		});

		await this._dbp;

		this.stores = ['store', ...moduleStores] as S;
		return updateState;
	}

	private _withIDBStore(type: IDBTransactionMode, store: 'store' | M, callback: ((store: IDBObjectStore) => void)): Promise<void> {
		return this._dbp.then(db => new Promise<void>((resolve, reject) => {
			const transaction = db.transaction(store, type);
			transaction.oncomplete = () => resolve();
			transaction.onabort = transaction.onerror = () => reject(transaction.error);
			callback(transaction.objectStore(store));
		}));
	}

	public openTransaction(storename, mode: IDBTransactionMode): Promise<IDBTransaction>{
		return this._dbp.then(db => db.transaction(storename, mode));
	}

	public get<Type>(key: IDBValidKey, storename: 'store' | M): Promise<Type> {
		let req: IDBRequest;
		return this._withIDBStore('readonly', storename, store => {
			req = store.get(key);
		}).then(() => req.result);
	}

	public set(key: IDBValidKey, value: any, storename: 'store' | M): Promise<void> {
		return this._withIDBStore('readwrite', storename, store => {
			store.put(value, key);
		});
	}

	public entries(storename: 'store' | M): Promise<[IDBValidKey, unknown][]> {
		const entries: [IDBValidKey, unknown][] = [];

		return this._withIDBStore('readonly', storename, store => {
			store.openCursor().onsuccess = function () {
				if (!this.result) return;
				entries.push([this.result.key, this.result.value]);
				this.result.continue();
			};
		}).then(() => entries);
	}

	public async bulkSet(map: [IDBValidKey, any][], storename: 'store' | M): Promise<void> {
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
