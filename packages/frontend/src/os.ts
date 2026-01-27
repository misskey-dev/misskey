/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// TODO: なんでもかんでもos.tsに突っ込むのやめたいのでよしなに分割する

import { markRaw, ref, defineAsyncComponent, nextTick } from 'vue';
import { EventEmitter } from 'eventemitter3';
import * as Misskey from 'misskey-js';
import type { Component, MaybeRef } from 'vue';
import type { ComponentEmit, ComponentProps as CP } from 'vue-component-type-helpers';
import type { Form, GetFormResultType } from '@/utility/form.js';
import type { MenuItem } from '@/types/menu.js';
import type { PostFormProps } from '@/types/post-form.js';
import type { UploaderFeatures } from '@/composables/use-uploader.js';
import type { MkSelectItem } from '@/components/MkSelect.vue';
import type { OptionValue } from '@/types/option-value.js';
import type { MkDialogReturnType } from '@/components/MkDialog.vue';
import type { OverloadToUnion } from '@/types/overload-to-union.js';
import type MkRoleSelectDialog_TypeReferenceOnly from '@/components/MkRoleSelectDialog.vue';
import type MkEmojiPickerDialog_TypeReferenceOnly from '@/components/MkEmojiPickerDialog.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { prefer } from '@/preferences.js';
import { i18n } from '@/i18n.js';
import MkPostFormDialog from '@/components/MkPostFormDialog.vue';
import MkWaitingDialog from '@/components/MkWaitingDialog.vue';
import MkPageWindow from '@/components/MkPageWindow.vue';
import MkToast from '@/components/MkToast.vue';
import MkDialog from '@/components/MkDialog.vue';
import MkPopupMenu from '@/components/MkPopupMenu.vue';
import MkContextMenu from '@/components/MkContextMenu.vue';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { pleaseLogin } from '@/utility/please-login.js';
import { showMovedDialog } from '@/utility/show-moved-dialog.js';
import { getHTMLElementOrNull } from '@/utility/get-dom-node-or-null.js';
import { focusParent } from '@/utility/focus.js';

export const openingWindowsCount = ref(0);

export type ApiWithDialogCustomErrors = Record<string, { title?: string; text: string; }>;
export const apiWithDialog = (<E extends keyof Misskey.Endpoints>(
	endpoint: E,
	data: Misskey.Endpoints[E]['req'],
	token?: string | null | undefined,
	customErrors?: ApiWithDialogCustomErrors,
) => {
	const promise = misskeyApi(endpoint, data, token);
	promiseDialog(promise, null, async (err) => {
		let title: string | undefined;
		let text = err.message + '\n' + err.id;
		if (err.code === 'INTERNAL_ERROR') {
			title = i18n.ts.internalServerError;
			text = i18n.ts.internalServerErrorDescription;
			const date = new Date().toISOString();
			const { result } = await actions({
				type: 'error',
				title,
				text,
				actions: [{
					value: 'ok',
					text: i18n.ts.gotIt,
					primary: true,
				}, {
					value: 'copy',
					text: i18n.ts.copyErrorInfo,
				}],
			});
			if (result === 'copy') {
				copyToClipboard(`Endpoint: ${endpoint}\nInfo: ${JSON.stringify(err.info)}\nDate: ${date}`);
			}
			return;
		} else if (err.code === 'RATE_LIMIT_EXCEEDED') {
			title = i18n.ts.cannotPerformTemporary;
			text = i18n.ts.cannotPerformTemporaryDescription;
		} else if (err.code === 'INVALID_PARAM') {
			title = i18n.ts.invalidParamError;
			text = i18n.ts.invalidParamErrorDescription;
		} else if (err.code === 'ROLE_PERMISSION_DENIED') {
			title = i18n.ts.permissionDeniedError;
			text = i18n.ts.permissionDeniedErrorDescription;
		} else if (err.code.startsWith('TOO_MANY')) { // TODO: バックエンドに kind: client/contentsLimitExceeded みたいな感じで送るように統一してもらってそれで判定する
			title = i18n.ts.youCannotCreateAnymore;
			text = `${i18n.ts.error}: ${err.id}`;
		} else if (err.message.startsWith('Unexpected token')) {
			title = i18n.ts.gotInvalidResponseError;
			text = i18n.ts.gotInvalidResponseErrorDescription;
		} else if (customErrors && customErrors[err.id] != null) {
			title = customErrors[err.id].title;
			text = customErrors[err.id].text;
		}
		alert({
			type: 'error',
			title,
			text,
		});
	});

	return promise;
});

export function promiseDialog<T extends Promise<any>>(
	promise: T,
	onSuccess?: ((res: Awaited<T>) => void) | null,
	onFailure?: ((err: Misskey.api.APIError) => void) | null,
	text?: string,
): T {
	const showing = ref(true);
	const success = ref(false);

	promise.then(res => {
		if (onSuccess) {
			showing.value = false;
			onSuccess(res);
		} else {
			success.value = true;
			window.setTimeout(() => {
				showing.value = false;
			}, 1000);
		}
	}).catch(err => {
		showing.value = false;
		if (onFailure) {
			onFailure(err);
		} else {
			alert({
				type: 'error',
				text: err,
			});
		}
	});

	// NOTE: dynamic importすると挙動がおかしくなる(showingの変更が伝播しない)
	const { dispose } = popup(MkWaitingDialog, {
		success: success,
		showing: showing,
		text: text,
	}, {
		closed: () => dispose(),
	});

	return promise;
}

let popupIdCount = 0;
export const popups = ref<{
	id: number;
	component: Component;
	props: Record<string, any>;
	events: Record<string, any>;
}[]>([]);

const zIndexes = {
	veryLow: 500000,
	low: 1000000,
	middle: 2000000,
	high: 3000000,
};
export function claimZIndex(priority: keyof typeof zIndexes = 'low'): number {
	zIndexes[priority] += 100;
	return zIndexes[priority];
}

// props に ref を許可するようにする
type PropsWithRefs<P> = { [K in keyof P]: MaybeRef<P[K]> };
type ComponentProps<T extends Component> = PropsWithRefs<CP<T>>;

// 関数の引数が any[] (もっとも広義なもの) かどうかを判定し、any[] の場合は排除 (never) するヘルパー
type FilterSpecificFunc<T> = T extends (...args: any[]) => void
	? (any[] extends Parameters<T> ? never : T)
	: T;

// オブジェクトの各プロパティに対して再帰的、あるいは単純に適用する型関数
type CleanFunctions<T> = {
	[K in keyof T]: T[K] extends (...args: any[]) => any
		? FilterSpecificFunc<T[K]>
		: T[K];
};

// emitの関数群をオブジェクト型に変換する（InstanceType<Component>['$emit']はFunctionalComponent = ジェネリックコンポーネントでは使用できない）
type ComponentEmitsObject<C extends Component, IE = OverloadToUnion<ComponentEmit<C>>> = CleanFunctions<{
	[K in IE extends (evName: infer U, ...args: any[]) => any ? U & PropertyKey : never]: IE extends (evName: K, ...args: infer A) => infer R
		? (...args: A) => R
		: (...args: any[]) => void;
}>;

// NOTE: ジェネリック型つきのコンポーネントでは、emitsの型推論がうまく働かない（型変数を取り出すことはできないため）
// NOTE: emitsがOverloadToUnionで対応しているオーバーロードの数を超える場合は、OverloadToUnionの個数を増やせばOK
export function popup<T extends Component>(
	component: T,
	props: ComponentProps<T>,
	events: Partial<ComponentEmitsObject<T>> = {},
): { dispose: () => void } {
	markRaw(component);

	const id = ++popupIdCount;
	const dispose = () => {
		// このsetTimeoutが無いと挙動がおかしくなる(autocompleteが閉じなくなる)。Vueのバグ？
		window.setTimeout(() => {
			popups.value = popups.value.filter(p => p.id !== id);
		}, 0);
	};
	const state = {
		component,
		props,
		events,
		id,
	};

	popups.value.push(state);

	return {
		dispose,
	};
}

export async function popupAsyncWithDialog<T extends Component>(
	componentFetching: Promise<T>,
	props: ComponentProps<T>,
	events: Partial<ComponentEmitsObject<T>> = {},
): Promise<{ dispose: () => void }> {
	let component: T;
	let closeWaiting = () => { };

	const timer = window.setTimeout(() => {
		closeWaiting = waiting();
	}, 100); // コンポーネントがキャッシュされている場合にもwaitingが表示されて画面がちらつくのを防止するためにラグを追加

	try {
		component = await componentFetching;
	} catch (err) {
		window.clearTimeout(timer);
		closeWaiting();
		alert({
			type: 'error',
			title: i18n.ts.somethingHappened,
			text: 'CODE: ASYNC_COMP_LOAD_FAIL',
		});
		throw err;
	}

	window.clearTimeout(timer);
	closeWaiting();

	markRaw(component);

	const id = ++popupIdCount;
	const dispose = () => {
		// このsetTimeoutが無いと挙動がおかしくなる(autocompleteが閉じなくなる)。Vueのバグ？
		window.setTimeout(() => {
			popups.value = popups.value.filter(p => p.id !== id);
		}, 0);
	};
	const state = {
		component,
		props,
		events,
		id,
	};

	popups.value.push(state);

	return {
		dispose,
	};
}

export function pageWindow(path: string) {
	const { dispose } = popup(MkPageWindow, {
		initialPath: path,
	}, {
		closed: () => dispose(),
	});
}

export function toast(message: string) {
	const { dispose } = popup(MkToast, {
		message,
	}, {
		closed: () => dispose(),
	});
}

export function alert(props: {
	type?: 'error' | 'info' | 'success' | 'warning' | 'waiting' | 'question';
	title?: string;
	text?: string;
}): Promise<void> {
	return new Promise(resolve => {
		const { dispose } = popup(MkDialog, props, {
			done: () => {
				resolve();
			},
			closed: () => dispose(),
		});
	});
}

export function confirm(props: {
	type: 'error' | 'info' | 'success' | 'warning' | 'waiting' | 'question';
	title?: string;
	text?: string;
	okText?: string;
	cancelText?: string;
}): Promise<{ canceled: boolean }> {
	return new Promise(resolve => {
		const { dispose } = popup(MkDialog, {
			...props,
			showCancelButton: true,
		}, {
			done: result => {
				resolve(result ? result : { canceled: true });
			},
			closed: () => dispose(),
		});
	});
}

type ActionsAction = {
	value: string;
	text: string;
	primary?: boolean;
	danger?: boolean;
};

export function actions<const T extends ActionsAction[]>(props: {
	type: 'error' | 'info' | 'success' | 'warning' | 'waiting' | 'question';
	title?: string;
	text?: string;
	actions: T;
}): Promise<MkDialogReturnType<T[number]['value']>> {
	return new Promise(resolve => {
		const { dispose } = popup(MkDialog, {
			...props,
			actions: props.actions.map(a => ({
				text: a.text,
				primary: a.primary,
				danger: a.danger,
				callback: () => {
					resolve({ canceled: false, result: a.value });
				},
			})),
		}, {
			done: result => {
				resolve(result as MkDialogReturnType<T[number]['value']>);
			},
			closed: () => dispose(),
		});
	});
}

// default が指定されていたら result は null になり得ないことを保証する overload function
export function inputText(props: {
	type?: 'text' | 'email' | 'password' | 'url';
	title?: string;
	text?: string;
	placeholder?: string | null;
	autocomplete?: string;
	default: string;
	minLength?: number;
	maxLength?: number;
}): Promise<MkDialogReturnType<string>>;
// min lengthが指定されてたら result は null になり得ないことを保証する overload function
export function inputText(props: {
	type?: 'text' | 'email' | 'password' | 'url';
	title?: string;
	text?: string;
	placeholder?: string | null;
	autocomplete?: string;
	default?: string;
	minLength: number;
	maxLength?: number;
}): Promise<MkDialogReturnType<string>>;
export function inputText(props: {
	type?: 'text' | 'email' | 'password' | 'url';
	title?: string;
	text?: string;
	placeholder?: string | null;
	autocomplete?: string;
	default?: string | null;
	minLength?: number;
	maxLength?: number;
}): Promise<MkDialogReturnType<string | null>>;
export function inputText(props: {
	type?: 'text' | 'email' | 'password' | 'url';
	title?: string;
	text?: string;
	placeholder?: string | null;
	autocomplete?: string;
	default?: string | null;
	minLength?: number;
	maxLength?: number;
}): Promise<MkDialogReturnType<string | null>> {
	return new Promise(resolve => {
		const { dispose } = popup(MkDialog, {
			title: props.title,
			text: props.text,
			input: {
				type: props.type,
				placeholder: props.placeholder,
				autocomplete: props.autocomplete,
				default: props.default ?? null,
				minLength: props.minLength,
				maxLength: props.maxLength,
			},
		}, {
			done: result => {
				resolve(result as MkDialogReturnType<string | null>);
			},
			closed: () => dispose(),
		});
	});
}

// default が指定されていたら result は null になり得ないことを保証する overload function
export function inputNumber(props: {
	title?: string;
	text?: string;
	placeholder?: string | null;
	autocomplete?: string;
	default: number;
}): Promise<MkDialogReturnType<number>>;
export function inputNumber(props: {
	title?: string;
	text?: string;
	placeholder?: string | null;
	autocomplete?: string;
	default?: number | null;
}): Promise<MkDialogReturnType<number | null>>;
export function inputNumber(props: {
	title?: string;
	text?: string;
	placeholder?: string | null;
	autocomplete?: string;
	default?: number | null;
}): Promise<MkDialogReturnType<number | null>> {
	return new Promise(resolve => {
		const { dispose } = popup(MkDialog, {
			title: props.title,
			text: props.text,
			input: {
				type: 'number',
				placeholder: props.placeholder,
				autocomplete: props.autocomplete,
				default: props.default ?? null,
			},
		}, {
			done: result => {
				resolve(result as MkDialogReturnType<number | null>);
			},
			closed: () => dispose(),
		});
	});
}

export function inputDatetime(props: {
	title?: string;
	text?: string;
	placeholder?: string | null;
	default?: string | null;
}): Promise<MkDialogReturnType<Date>> {
	return new Promise(resolve => {
		const { dispose } = popup(MkDialog, {
			title: props.title,
			text: props.text,
			input: {
				type: 'datetime-local',
				placeholder: props.placeholder,
				default: props.default ?? null,
			},
		}, {
			done: result => {
				resolve(result != null && typeof result.result === 'string' ? { result: new Date(result.result), canceled: false } : { result: undefined, canceled: true });
			},
			closed: () => dispose(),
		});
	});
}

export function authenticateDialog(): Promise<{
	canceled: true; result: undefined;
} | {
	canceled: false; result: { password: string; token: string | null; };
}> {
	return new Promise(resolve => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkPasswordDialog.vue')), {}, {
			done: result => {
				resolve(result ? { canceled: false, result } : { canceled: true, result: undefined });
			},
			closed: () => dispose(),
		});
	});
}

export function select<C extends OptionValue, D extends C | null = null>(props: {
	title?: string;
	text?: string;
	default?: D;
	items: (MkSelectItem<C> | undefined)[];
}): Promise<MkDialogReturnType<Exclude<D, undefined> extends null ? C | null : C>> {
	return new Promise(resolve => {
		const { dispose } = popup(MkDialog, {
			title: props.title,
			text: props.text,
			select: {
				items: props.items.filter(x => x !== undefined),
				default: props.default ?? null,
			},
		}, {
			done: result => {
				resolve(result as MkDialogReturnType<Exclude<D, undefined> extends null ? C | null : C>);
			},
			closed: () => dispose(),
		});
	});
}

export function success(): Promise<void> {
	return new Promise(resolve => {
		const showing = ref(true);
		window.setTimeout(() => {
			showing.value = false;
		}, 1000);
		const { dispose } = popup(MkWaitingDialog, {
			success: true,
			showing: showing,
		}, {
			done: () => resolve(),
			closed: () => dispose(),
		});
	});
}

export function waiting(options: { text?: string } = {}) {
	window.document.body.setAttribute('inert', 'true');

	const showing = ref(true);
	const isSuccess = ref(false);

	function done(doneOptions: { success?: boolean } = {}) {
		if (doneOptions.success) {
			isSuccess.value = true;
			window.setTimeout(() => {
				showing.value = false;
			}, 1000);
		} else {
			showing.value = false;
		}
	}

	// NOTE: dynamic importすると挙動がおかしくなる(showingの変更が伝播しない)
	const { dispose } = popup(MkWaitingDialog, {
		success: isSuccess,
		showing: showing,
		text: options.text,
	}, {
		closed: () => {
			window.document.body.removeAttribute('inert');
			dispose();
		},
	});

	return done;
}

export function form<F extends Form>(title: string, f: F): Promise<{ canceled: true, result?: undefined } | { canceled?: false, result: GetFormResultType<F> }> {
	return new Promise(resolve => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkFormDialog.vue')), { title, form: f }, {
			done: result => {
				resolve(result as { canceled?: false, result: GetFormResultType<F> });
			},
			closed: () => dispose(),
		});
	});
}

export async function selectUser(opts: { includeSelf?: boolean; localOnly?: boolean; } = {}): Promise<Misskey.entities.UserDetailed> {
	return new Promise(resolve => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkUserSelectDialog.vue')), {
			includeSelf: opts.includeSelf,
			localOnly: opts.localOnly,
		}, {
			ok: user => {
				resolve(user);
			},
			closed: () => dispose(),
		});
	});
}

export async function selectRole(params: ComponentProps<typeof MkRoleSelectDialog_TypeReferenceOnly>): Promise<
	{ canceled: true; result: undefined; } |
	{ canceled: false; result: Misskey.entities.Role[] }
> {
	return new Promise((resolve) => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkRoleSelectDialog.vue')), params, {
			done: roles => {
				resolve({ canceled: false, result: roles });
			},
			close: () => {
				resolve({ canceled: true, result: undefined });
			},
			closed: () => dispose(),
		});
	});
}

export async function pickEmoji(anchorElement: HTMLElement, opts: ComponentProps<typeof MkEmojiPickerDialog_TypeReferenceOnly>): Promise<string> {
	return new Promise(resolve => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkEmojiPickerDialog.vue')), {
			anchorElement,
			...opts,
		}, {
			done: emoji => {
				resolve(emoji);
			},
			closed: () => dispose(),
		});
	});
}

export async function cropImageFile<F extends File | Blob>(imageFile: F, options: {
	aspectRatio: number | null;
}): Promise<F> {
	return new Promise(resolve => {
		const { dispose } = popup(defineAsyncComponent(() => import('@/components/MkCropperDialog.vue')), {
			imageFile: imageFile,
			aspectRatio: options.aspectRatio,
		}, {
			ok: x => {
				resolve(x as F);
			},
			closed: () => dispose(),
		});
	});
}

export function popupMenu(items: (MenuItem | null)[], anchorElement?: HTMLElement | EventTarget | null, options?: {
	align?: string;
	width?: number;
	onClosing?: () => void;
	onClosed?: () => void;
}): Promise<void> {
	if (!(anchorElement instanceof HTMLElement)) {
		anchorElement = null;
	}

	let returnFocusTo = getHTMLElementOrNull(anchorElement) ?? getHTMLElementOrNull(window.document.activeElement);
	return new Promise(resolve => nextTick(() => {
		const { dispose } = popup(MkPopupMenu, {
			items: items.filter(x => x != null),
			anchorElement,
			width: options?.width,
			align: options?.align,
			returnFocusTo,
		}, {
			closed: () => {
				resolve();
				dispose();
				returnFocusTo = null;
				options?.onClosed?.();
			},
			closing: () => {
				options?.onClosing?.();
			},
		});
	}));
}

export function contextMenu(items: MenuItem[], ev: PointerEvent): Promise<void> {
	if (
		prefer.s.contextMenu === 'native' ||
		(prefer.s.contextMenu === 'appWithShift' && !ev.shiftKey)
	) {
		return Promise.resolve();
	}

	let returnFocusTo = getHTMLElementOrNull(ev.currentTarget ?? ev.target) ?? getHTMLElementOrNull(window.document.activeElement);
	ev.preventDefault();
	return new Promise(resolve => nextTick(() => {
		const { dispose } = popup(MkContextMenu, {
			items,
			ev,
		}, {
			closed: () => {
				resolve();
				dispose();

				// MkModalを通していないのでここでフォーカスを戻す処理を行う
				if (returnFocusTo != null) {
					focusParent(returnFocusTo, true, false);
					returnFocusTo = null;
				}
			},
		});
	}));
}

export async function post(props: PostFormProps = {}): Promise<void> {
	const isLoggedIn = await pleaseLogin({
		openOnRemote: (props.initialText || props.initialNote ? {
			type: 'share',
			params: {
				text: props.initialText ?? props.initialNote?.text ?? '',
				visibility: props.initialVisibility ?? props.initialNote?.visibility ?? 'public',
				localOnly: (props.initialLocalOnly || props.initialNote?.localOnly) ? '1' : '0',
			},
		} : undefined),
	});
	if (!isLoggedIn) return;

	showMovedDialog();
	return new Promise(resolve => {
		// NOTE: MkPostFormDialogをdynamic importするとiOSでテキストエリアに自動フォーカスできない
		// NOTE: ただ、dynamic importしない場合、MkPostFormDialogインスタンスが使いまわされ、
		//       Vueが渡されたコンポーネントに内部的に__propsというプロパティを生やす影響で、
		//       複数のpost formを開いたときに場合によってはエラーになる
		//       もちろん複数のpost formを開けること自体Misskeyサイドのバグなのだが
		const { dispose } = popup(MkPostFormDialog, props, {
			closed: () => {
				resolve();
				dispose();
			},
		});
	});
}

export const deckGlobalEvents = new EventEmitter();

/*
export function checkExistence(fileData: ArrayBuffer): Promise<any> {
	return new Promise((resolve, reject) => {
		const data = new FormData();
		data.append('md5', getMD5(fileData));

		api('drive/files/find-by-hash', {
			md5: getMD5(fileData)
		}).then(resp => {
			resolve(resp.length > 0 ? resp[0] : null);
		});
	});
}*/

export function chooseFileFromPc(
	options: {
		multiple?: boolean;
	} = {},
): Promise<File[]> {
	return new Promise((res, rej) => {
		const input = window.document.createElement('input');
		input.type = 'file';
		input.multiple = options.multiple ?? false;
		input.onchange = () => {
			if (!input.files) return res([]);

			res(Array.from(input.files));

			// 一応廃棄
			(window as any).__misskey_input_ref__ = null;
		};

		// https://qiita.com/fukasawah/items/b9dc732d95d99551013d
		// iOS Safari で正常に動かす為のおまじない
		(window as any).__misskey_input_ref__ = input;

		input.click();
	});
}

export async function launchUploader(
	files: File[],
	options?: {
		folderId?: string | null;
		multiple?: boolean;
		features?: UploaderFeatures;
	},
): Promise<Misskey.entities.DriveFile[]> {
	return new Promise((res, rej) => {
		if (files.length === 0) return rej();
		let dispose: () => void;
		popupAsyncWithDialog(import('@/components/MkUploaderDialog.vue').then(x => x.default), {
			files: markRaw(files),
			folderId: options?.folderId,
			multiple: options?.multiple,
			features: options?.features,
		}, {
			done: driveFiles => {
				if (driveFiles.length === 0) return rej();
				res(driveFiles);
			},
			closed: () => dispose(),
		}).then(d => dispose = d.dispose, rej);
	});
}

export const pageFolderTeleportCount = ref(0);
