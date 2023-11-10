import { api } from '@/os.js';
import { miLocalStorage } from '@/local-storage.js';
import { $i } from '@/account.js';

type ScriptType = 'widget' | 'plugins' | 'flash';
export type ScriptData = { type: ScriptType; id?: string; fromAccount?: boolean };

export async function loadScriptStorage(toAccount: boolean, scriptData: ScriptData, key: string) {
	let value: string | null;
	if ($i && toAccount && (scriptData.type !== 'plugins' || (scriptData.type === 'plugins' && scriptData.fromAccount))) {
		if (scriptData.type === 'widget') {
			value = await api('i/registry/get', { scope: ['client', 'aiscript', scriptData.type], key: key });
		} else {
			value = await api('i/registry/get', { scope: ['client', 'aiscript', scriptData.type, scriptData.id!], key: key });
		}
	} else {
		value = miLocalStorage.getItem(`aiscript:${scriptData.type}:${key}`);
	}

	if (value === null) return null;
	return JSON.parse(value);
}

export async function saveScriptStorage(toAccount: boolean, scriptData: ScriptData, key: string, value: any) {
	const jsonValue = JSON.stringify(value);
	if ($i && toAccount && (scriptData.type !== 'plugins' || (scriptData.type === 'plugins' && scriptData.fromAccount))) {
		if (scriptData.type === 'widget') {
			await api('i/registry/set', { scope: ['client', 'aiscript', scriptData.type], key: key, value: jsonValue });
		} else {
			await api('i/registry/set', { scope: ['client', 'aiscript', scriptData.type, scriptData.id!], key: key, value: jsonValue });
		}
	} else {
		miLocalStorage.setItem(`aiscript:${scriptData.type}:${key}`, jsonValue);
	}
}
