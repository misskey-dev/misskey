import { Store } from 'idb-keyval';
// Provide functions from idb-keyval
export { get, set, del, clear, keys } from 'idb-keyval';

//#region Construct DB
export const clientDb = {
	i18nContexts: new Store('MisskeyClient', 'i18nContexts')
};
//#endregion

//#region Provide some tool functions
function openTransaction(store: Store, mode: IDBTransactionMode): Promise<IDBTransaction>{
	return store._dbp.then(db => db.transaction(store.storeName, mode));
}

export function entries(store: Store): Promise<[IDBValidKey, unknown][]> {
	const entries: [IDBValidKey, unknown][] = [];

	return store._withIDBStore('readonly', store => {
		store.openCursor().onsuccess = function (e) {
			if (!this.result) return;
			entries.push([this.result.key, this.result.value]);
			this.result.continue();
		};
	}).then(() => entries);
}

export async function bulkSet(map: [IDBValidKey, any][], store: Store): Promise<void> {
	const tx = await openTransaction(store, 'readwrite');
	const st = tx.objectStore(store.storeName);
	for (const [key, value] of map) {
		st.put(value, key);
	}
	return new Promise((resolve, reject) => {
		tx.oncomplete = () => resolve();
		tx.abort = tx.onerror = () => reject(tx.error);
	});
}

export function count(store: Store): Promise<number> {
	let req: IDBRequest<number>;
	return store._withIDBStore('readonly', store => {
		req = store.count();
	}).then(() => req.result);
}
//#endregion
