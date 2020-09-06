import { defineAsyncComponent } from 'vue';
import Stream from '@/scripts/stream';
import { store } from '@/store';
import { apiUrl } from '@/config';

export const stream = new Stream();

export const dialogCallbacks = {};

export function api(endpoint: string, data: Record<string, any> = {}, token?: string | null | undefined) {
	store.commit('beginApiRequest');

	const onFinally = () => {
		store.commit('endApiRequest');
	};

	const promise = new Promise((resolve, reject) => {
		// Append a credential
		if (store.getters.isSignedIn) (data as any).i = store.state.i.token;
		if (token !== undefined) (data as any).i = token;

		// Send request
		fetch(endpoint.indexOf('://') > -1 ? endpoint : `${apiUrl}/${endpoint}`, {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'omit',
			cache: 'no-cache'
		}).then(async (res) => {
			const body = res.status === 204 ? null : await res.json();

			if (res.status === 200) {
				resolve(body);
			} else if (res.status === 204) {
				resolve();
			} else {
				reject(body.error);
			}
		}).catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
}

export function dialog(props: Record<string, any>) {
	return store.dispatch('popup', {
		component: defineAsyncComponent(() => import('@/components/dialog.vue')),
		props
	});
}

export function menu(props: Record<string, any>) {
	return store.dispatch('popup', {
		component: defineAsyncComponent(() => import('@/components/menu.vue')),
		props
	});
}

export function sound(type: string) {
	if (store.state.device.sfxVolume === 0) return;
	const sound = store.state.device['sfx' + type.substr(0, 1).toUpperCase() + type.substr(1)];
	if (sound == null) return;
	const audio = new Audio(`/assets/sounds/${sound}.mp3`);
	audio.volume = store.state.device.sfxVolume;
	audio.play();
}
