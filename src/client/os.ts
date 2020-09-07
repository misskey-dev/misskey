import { Component, defineAsyncComponent, markRaw, ref } from 'vue';
import Stream from '@/scripts/stream';
import { store } from '@/store';
import { apiUrl } from '@/config';

const ua = navigator.userAgent.toLowerCase();
export const isMobile = /mobile|iphone|ipad|android/.test(ua);

export const stream = new Stream();

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

export function popup(component: Component, props: Record<string, any>, callback?: Function, option?) {
	markRaw(component);
	const id = Math.random().toString(); // TODO: uuidとか使う
	const showing = ref(true);
	const close = (...args) => {
		if (callback) callback(...args);
		showing.value = false;
	};
	const modal = {
		type: 'popup',
		component,
		props,
		showing,
		source: option?.source,
		done: close,
		bgClick: () => close(),
		closed: () => {
			store.commit('removePopup', id);
		},
		id,
	};
	store.commit('addPopup', modal);
	return close;
}

export function modal(component: Component, props: Record<string, any>, callback?: Function, option?) {
	markRaw(component);
	const id = Math.random().toString(); // TODO: uuidとか使う
	const showing = ref(true);
	const close = (...args) => {
		if (callback) callback(...args);
		showing.value = false;
	};
	const modal = {
		type: 'modal',
		component,
		props,
		showing,
		source: option?.source,
		done: close,
		bgClick: () => close(),
		closed: () => {
			store.commit('removePopup', id);
		},
		id,
	};
	store.commit('addPopup', modal);
	return close;
}

export function dialog(props: Record<string, any>) {
	return new Promise((res, rej) => {
		modal(defineAsyncComponent(() => import('@/components/dialog.vue')), props, result => {
			if (result) {
				res(result);
			} else {
				res({ canceled: true });
			}
		});
	});
}

export function menu(props: Record<string, any>) {
	const source = props.source; // TODO: sourceはpropsの外に出して追加の引数として受け取るようにする
	return new Promise((res, rej) => {
		modal(defineAsyncComponent(() => import('@/components/menu.vue')), props, res, {
			position: 'source',
			source
		});
	});
}

export function post(props: Record<string, any>) {
	return new Promise((res, rej) => {
		modal(defineAsyncComponent(() => import('@/components/post-form.vue')), props, res);
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
