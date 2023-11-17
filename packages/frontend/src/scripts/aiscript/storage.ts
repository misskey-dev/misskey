import { api } from '@/os.js';
import { miLocalStorage } from '@/local-storage.js';
import { $i } from '@/account.js';

type ScriptType = 'widget' | 'plugins' | 'flash';
export type StorageMetadata = { type: ScriptType; id?: string; fromAccount?: boolean };

export async function loadScriptStorage(toAccount: boolean, storageMetadata: StorageMetadata, key: string) {
	let value: string | null;
	if ($i && toAccount && (storageMetadata.type !== 'plugins' || (storageMetadata.type === 'plugins' && storageMetadata.fromAccount))) {
		if (storageMetadata.type === 'widget') {
			value = await api('i/registry/get', { scope: ['client', 'aiscript', storageMetadata.type], key: key });
		} else {
			value = await api('i/registry/get', { scope: ['client', 'aiscript', storageMetadata.type, storageMetadata.id!], key: key });
		}
	} else {
		if (storageMetadata.type === 'widget') {
			value = miLocalStorage.getItem(`aiscript:${storageMetadata.type}:${key}`);
		} else {
			value = miLocalStorage.getItem(`aiscript:${storageMetadata.type}:${storageMetadata.id!}:${key}`);
		}
	}

	if (value === null) return null;
	return JSON.parse(value);
}

export async function saveScriptStorage(toAccount: boolean, storageMetadata: StorageMetadata, key: string, value: any) {
	const jsonValue = JSON.stringify(value);
	if ($i && toAccount && (storageMetadata.type !== 'plugins' || (storageMetadata.type === 'plugins' && storageMetadata.fromAccount))) {
		if (storageMetadata.type === 'widget') {
			await api('i/registry/set', { scope: ['client', 'aiscript', storageMetadata.type], key: key, value: jsonValue });
		} else {
			await api('i/registry/set', { scope: ['client', 'aiscript', storageMetadata.type, storageMetadata.id!], key: key, value: jsonValue });
		}
	} else {
		if (storageMetadata.type === 'widget') {
			miLocalStorage.setItem(`aiscript:${storageMetadata.type}:${key}`, jsonValue);
		} else {
			miLocalStorage.setItem(`aiscript:${storageMetadata.type}:${storageMetadata.id!}:${key}`, jsonValue);
		}
	}
}
