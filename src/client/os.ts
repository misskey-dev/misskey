import { Component, defineAsyncComponent, markRaw, reactive, ref } from 'vue';
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

	if (_DEV_) {
		performance.mark(_PERF_PREFIX_ + 'api:begin');
	}

	const onFinally = () => {
		store.commit('endApiRequest');

		if (_DEV_) {
			performance.mark(_PERF_PREFIX_ + 'api:end');

			performance.measure(_PERF_PREFIX_ + 'api',
				_PERF_PREFIX_ + 'api:begin',
				_PERF_PREFIX_ + 'api:end');
		}
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
				if (_DEV_) console.log('os:popup close', id, component, props, events);
				// このsetTimeoutが無いと挙動がおかしくなる(autocompleteが閉じなくなる)。Vueのバグ？
				setTimeout(() => {
					store.commit('removePopup', id);
				}, 0);
				resolve();
			},
			id,
		};

		if (_DEV_) console.log('os:popup open', id, component, props, events);
		store.commit('addPopup', modal);

		onCancel.shouldReject = false;
		onCancel(() => {
			showing.value = false;
		});
	});
}

export function modal(component: Component | typeof import('*.vue'), props: Record<string, any>, events = {}, option?: { source?: any; position?: any; cancelableByBgClick?: boolean; }) {
	if (isModule(component)) component = component.default;

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
			position: option?.position,
			source: option?.source,
			done: close,
			bgClick: () => {
				if (option?.cancelableByBgClick === false) {
					// TODO: shake modal
					return;
				}
				close();
			},
			closed: () => {
				if (_DEV_) console.log('os:modal close', id, component, props, events, option);
				store.commit('removePopup', id);
			},
			id,
		};

		if (_DEV_) console.log('os:modal open', id, component, props, events, option);
		store.commit('addPopup', modal);

		onCancel.shouldReject = false;
		onCancel(() => {
			close();
		});
	});
}

// window にするとグローバルのアレと名前が被ってバグる
export function window_(component: Component | typeof import('*.vue'), props: Record<string, any>, events = {}) {
	modal(defineAsyncComponent(() => import('@/components/page-window.vue')), {
		component: component
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

export function contextmenu(props: Record<string, any>, e: MouseEvent) {
	e.preventDefault();
	for (const el of Array.from(document.querySelectorAll('body *'))) {
		el.addEventListener('mousedown', this.onMousedown);
	}
	return popup(defineAsyncComponent(() => import('@/components/menu.vue')), {
		...props,
		contextmenuEvent: e,
	}, {});
}

export function post(props: Record<string, any>) {
	return modal(defineAsyncComponent(() => import('@/components/post-form.vue')), props, {}, {
		position: 'top'
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

export const deckGlobalEvents = new EventEmitter();

export const uploads = ref([]);

export function upload(file: File, folder?: any, name?: string) {
	if (folder && typeof folder == 'object') folder = folder.id;

	return new Promise((resolve, reject) => {
		const id = Math.random();

		const reader = new FileReader();
		reader.onload = (e) => {
			const ctx = reactive({
				id: id,
				name: name || file.name || 'untitled',
				progressMax: undefined,
				progressValue: undefined,
				img: window.URL.createObjectURL(file)
			});

			uploads.value.push(ctx);

			const data = new FormData();
			data.append('i', store.state.i.token);
			data.append('force', 'true');
			data.append('file', file);

			if (folder) data.append('folderId', folder);
			if (name) data.append('name', name);

			const xhr = new XMLHttpRequest();
			xhr.open('POST', apiUrl + '/drive/files/create', true);
			xhr.onload = (e: any) => {
				const driveFile = JSON.parse(e.target.response);

				resolve(driveFile);

				uploads.value = uploads.value.filter(x => x.id != id);
			};

			xhr.upload.onprogress = e => {
				if (e.lengthComputable) {
					ctx.progressMax = e.total;
					ctx.progressValue = e.loaded;
				}
			};

			xhr.send(data);
		};
		reader.readAsArrayBuffer(file);
	});
}

/*
export function checkExistence(fileData: ArrayBuffer): Promise<any> {
	return new Promise((resolve, reject) => {
		const data = new FormData();
		data.append('md5', getMD5(fileData));

		os.api('drive/files/find-by-hash', {
			md5: getMD5(fileData)
		}).then(resp => {
			resolve(resp.length > 0 ? resp[0] : null);
		});
	});
}*/
