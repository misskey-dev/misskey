// FirefoxのプライベートモードなどではindexedDBが使用不可能なので、使う
import {
	get as iget,
	set as iset,
	del as idel
} from 'idb-keyval';

const fallbackName = (key: string) => `idbfallback::${key}`;

export async function get(key: string) {
	if (window.indexedDB) return iget(key);
	return JSON.parse(localStorage.getItem(fallbackName(key)));
}

export async function set(key: string, val: any) {
	if (window.indexedDB) return iset(key, val);
	return localStorage.setItem(fallbackName(key), JSON.stringify(val));
}

export async function del(key: string) {
	if (window.indexedDB) return idel(key);
	return localStorage.removeItem(fallbackName(key));
}
