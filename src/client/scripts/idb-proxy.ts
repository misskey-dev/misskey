// FirefoxのプライベートモードなどではindexedDBが使用不可能なので、使う
import {
	get as iget,
	set as iset,
	del as idel,
} from 'idb-keyval';

const fallbackName = (key: string) => `idbfallback::${key}`;

let idbAvailable = typeof window !== 'undefined' ? !!window.indexedDB : true;

if (idbAvailable) {
	try {
		const request = indexedDB.open('keyval-store');
		if (request.error) idbAvailable = false;
	} catch (e) {
		idbAvailable = false;
	}
}

export async function get(key: string) {
	if (idbAvailable) return iget(key);
	return JSON.parse(localStorage.getItem(fallbackName(key)));
}

export async function set(key: string, val: any) {
	if (idbAvailable) return iset(key, val);
	return localStorage.setItem(fallbackName(key), JSON.stringify(val));
}

export async function del(key: string) {
	if (idbAvailable) return idel(key);
	return localStorage.removeItem(fallbackName(key));
}
