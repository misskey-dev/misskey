import { Component, defineAsyncComponent, markRaw, ref } from 'vue';
import * as PCancelable from 'p-cancelable';
import { EventEmitter } from 'eventemitter3';
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

function isModule(x: any): x is typeof import('*.vue') {
	return x.default != null;
}

export function popup(component: Component | typeof import('*.vue'), props: Record<string, any>, events = {}, option?) {
	if (isModule(component)) component = component.default;

	if (_DEV_) {
		console.log('os:popup', component, props, events);
	}

	return new PCancelable((resolve, reject, onCancel) => {
		markRaw(component);
		const id = Math.random().toString(); // TODO: uuidとか使う
		const showing = ref(true);
		const modal = {
			type: 'popup',
			component,
			props,
			showing,
			events,
			closed: () => {
				store.commit('removePopup', id);
				resolve();
			},
			id,
		};
		store.commit('addPopup', modal);

		onCancel.shouldReject = false;
		onCancel(() => {
			showing.value = false;
		});
	});
}

export function modal(component: Component | typeof import('*.vue'), props: Record<string, any>, events = {}, option?: { source?: any; position?: any; cancelableByBgClick?: boolean; }) {
	if (isModule(component)) component = component.default;

	if (_DEV_) {
		console.log('os:modal', component, props, events, option);
	}

	return new PCancelable((resolve, reject, onCancel) => {
		markRaw(component);
		const id = Math.random().toString(); // TODO: uuidとか使う
		const showing = ref(true);
		const close = (...args) => {
			resolve(...args);
			showing.value = false;
		};
		const modal = {
			type: 'modal',
			component,
			props,
			showing,
			events,
			source: option?.source,
			done: close,
			bgClick: () => {
				if (option?.cancelableByBgClick === false) return;
				close();
			},
			closed: () => {
				store.commit('removePopup', id);
			},
			id,
		};
		store.commit('addPopup', modal);

		onCancel.shouldReject = false;
		onCancel(() => {
			close();
		});
	});
}

export function dialog(props: Record<string, any>, opts?: { cancelableByBgClick: boolean; }) {
	return new PCancelable((resolve, reject, onCancel) => {
		const dialog = modal(defineAsyncComponent(() => import('@/components/dialog.vue')), props, {}, { cancelableByBgClick: opts?.cancelableByBgClick });

		dialog.then(result => {
			if (result) {
				resolve(result);
			} else {
				resolve({ canceled: true });
			}
		});

		dialog.catch(reject);

		onCancel.shouldReject = false;
		onCancel(() => {
			dialog.cancel();
		});
	});
}

export function form(title, form, opts?) {
	return new PCancelable((resolve, reject, onCancel) => {
		const dialog = modal(defineAsyncComponent(() => import('@/components/form-window.vue')), { title, form }, {}, { cancelableByBgClick: opts?.cancelableByBgClick });

		dialog.then(result => {
			if (result) {
				resolve(result);
			} else {
				resolve({ canceled: true });
			}
		});

		dialog.catch(reject);

		onCancel.shouldReject = false;
		onCancel(() => {
			dialog.cancel();
		});
	});
}

export async function selectUser() {
	const component = await import('@/components/user-select.vue');
	return new Promise((res, rej) => {
		modal(component, {}).then(user => {
			if (user) {
				res(user);
			}
		});
	});
}

export async function selectDriveFile(multiple: boolean) {
	const component = await import('@/components/drive-window.vue');
	return new Promise((res, rej) => {
		modal(component, {
			type: 'file',
			multiple
		}).then(files => {
			if (files) {
				res(multiple ? files : files[0]);
			}
		});
	});
}

export async function selectDriveFolder(multiple: boolean) {
	const component = await import('@/components/drive-window.vue');
	return new Promise((res, rej) => {
		modal(component, {
			type: 'folder',
			multiple
		}).then(folders => {
			if (folders) {
				res(folders[0]);
			}
		});
	});
}

export function menu(props: Record<string, any>, opts?: { source: any; }) {
	return modal(defineAsyncComponent(() => import('@/components/menu.vue')), props, {}, {
		position: 'source',
		source: opts?.source
	});
}

export function post(props: Record<string, any>) {
	return modal(defineAsyncComponent(() => import('@/components/post-form.vue')), props);
}

export function sound(type: string) {
	if (store.state.device.sfxVolume === 0) return;
	const sound = store.state.device['sfx' + type.substr(0, 1).toUpperCase() + type.substr(1)];
	if (sound == null) return;
	const audio = new Audio(`/assets/sounds/${sound}.mp3`);
	audio.volume = store.state.device.sfxVolume;
	audio.play();
}

export const deckGlobalEvents = new EventEmitter();
