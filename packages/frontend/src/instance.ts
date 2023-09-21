import { reactive } from 'vue';
import * as Misskey from 'misskey-js';
import { api } from './os';
import { miLocalStorage } from './local-storage';

// TODO: 他のタブと永続化されたstateを同期

const cached = miLocalStorage.getItem('instance');

// TODO: instanceをリアクティブにするかは再考の余地あり

export const instance: Misskey.entities.InstanceMetadata = reactive(cached ? JSON.parse(cached) : {
	// TODO: set default values
});

export async function fetchInstance() {
	const meta = await api('meta', {
		detail: false,
	});

	for (const [k, v] of Object.entries(meta)) {
		instance[k] = v;
	}

	miLocalStorage.setItem('instance', JSON.stringify(instance));
}
