import { Component, defineAsyncComponent, markRaw, reactive, Ref, ref, watch } from 'vue';
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

export function apiWithDialog(endpoint: string, data: Record<string, any> = {}, token?: string | null | undefined, onSuccess?: (res: any) => void, onFailure?: (e: Error) => void) {
	const showing = ref(true);
	const state = ref('waiting');

	const promise = api(endpoint, data, token);
	promise.then(res => {
		if (onSuccess) {
			showing.value = false;
			onSuccess(res);
		} else {
			state.value = 'success';
			setTimeout(() => {
				showing.value = false;
			}, 1000);
		}
	}).catch(e => {
		showing.value = false;
		if (onFailure) {
			onFailure(e);
		} else {
			dialog({
				type: 'error',
				text: e
			});
		}
	});

	const { dispose } = popup(defineAsyncComponent(() => import('@/components/icon-dialog.vue')), {
		type: state,
		showing: showing
	}, {
		closed: () => dispose(),
	});

	return promise;
}

function isModule(x: any): x is typeof import('*.vue') {
	return x.default != null;
}

export const popups = ref([]) as Ref<{
	id: any;
	component: any;
	props: Record<string, any>;
}[]>;

export function popup(component: Component | typeof import('*.vue'), props: Record<string, any>, events = {}, disposeEvent?: string) {
	if (isModule(component)) component = component.default;
	markRaw(component);

	const id = Math.random().toString(); // TODO: uuidとか使う
	const dispose = () => {
		if (_DEV_) console.log('os:popup close', id, component, props, events);
		// このsetTimeoutが無いと挙動がおかしくなる(autocompleteが閉じなくなる)。Vueのバグ？
		setTimeout(() => {
			popups.value = popups.value.filter(popup => popup.id !== id);
		}, 0);
	};
	const state = {
		component,
		props,
		events: disposeEvent ? {
			...events,
			[disposeEvent]: dispose
		} : events,
		id,
	};

	if (_DEV_) console.log('os:popup open', id, component, props, events);
	popups.value.push(state);

	return {
		dispose,
	};
}

// window にするとグローバルのアレと名前が被ってバグる
export function window_(component: Component | typeof import('*.vue'), props: Record<string, any>, events = {}) {
	popup(defineAsyncComponent(() => import('@/components/page-window.vue')), {
		component: component
	});
}

export function dialog(props: Record<string, any>) {
	return new Promise((resolve, reject) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/dialog.vue')), props, {
			done: result => {
				resolve(result ? result : { canceled: true });
			},
			closed: () => dispose(),
		});
	});
}

export function success() {
	return new Promise((resolve, reject) => {
		const showing = ref(true);
		setTimeout(() => {
			showing.value = false;
		}, 1000);
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/icon-dialog.vue')), {
			type: 'success',
			showing: showing
		}, {
			done: () => resolve(),
			closed: () => dispose(),
		});
	});
}

export function waiting() {
	return new Promise((resolve, reject) => {
		const showing = ref(true);
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/icon-dialog.vue')), {
			type: 'waiting',
			showing: showing
		}, {
			done: () => resolve(),
			closed: () => dispose(),
		});
	});
}

export function form(title, form) {
	return new Promise((resolve, reject) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/form-dialog.vue')), { title, form }, {
			done: result => {
				resolve(result);
			},
			closed: () => dispose(),
		});
	});
}

export async function selectUser() {
	return new Promise((resolve, reject) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/user-select-dialog.vue')), {}, {
			done: result => {
				resolve(result ? result : { canceled: true });
			},
			closed: () => dispose(),
		});
	});
}

export async function selectDriveFile(multiple: boolean) {
	return new Promise((resolve, reject) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/drive-window.vue')), {
			type: 'file',
			multiple
		}, {
			done: files => {
				if (files) {
					resolve(multiple ? files : files[0]);
				}
			},
			closed: () => dispose(),
		});
	});
}

export async function selectDriveFolder(multiple: boolean) {
	return new Promise((resolve, reject) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/drive-window.vue')), {
			type: 'folder',
			multiple
		}, {
			done: folders => {
				if (folders) {
					resolve(multiple ? folders : folders[0]);
				}
			},
			closed: () => dispose(),
		});
	});
}

export function modalMenu(items: any[], src?: HTMLElement, options?: { viaKeyboard?: boolean }) {
	return new Promise((resolve, reject) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/ui/modal-menu.vue')), {
			items,
			src,
			viaKeyboard: options?.viaKeyboard
		}, {
			closed: () => {
				resolve();
				dispose();
			},
		});
	});
}

export function contextMenu(items: any[], ev: MouseEvent) {
	ev.preventDefault();
	return new Promise((resolve, reject) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/ui/context-menu.vue')), {
			items,
			ev,
		}, {
			closed: () => {
				resolve();
				dispose();
			},
		});
	});
}

export function post(props: Record<string, any>) {
	return new Promise((resolve, reject) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/post-form-dialog.vue')), props, {
			closed: () => {
				resolve();
				dispose();
			},
		});
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
