/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { ref } from 'vue';
import { apiUrl } from '@/config.js';
import { $i } from '@/account.js';
import { miLocalStorage } from '@/local-storage.js';
import { time as gtagTime } from 'vue-gtag';
import { instance } from '@/instance.js';
export const pendingApiRequestsCount = ref(0);

let id: string | null = miLocalStorage.getItem('id');
export function generateClientTransactionId(initiator: string) {
	if (id === null) {
		id = crypto.randomUUID().replaceAll('-', '');
		miLocalStorage.setItem('id', id);
	}

	// ハイフンが含まれている場合は除去
	if (id.includes('-')) {
		id = id.replaceAll('-', '');
		miLocalStorage.setItem('id', id);
	}

	return `${id}-${initiator}-${crypto.randomUUID().replaceAll('-', '')}`;
}

function handleResponse<_ResT>(
	resolve: (value: (_ResT | PromiseLike<_ResT>)) => void,
	reject: (reason?: any) => void,
): ((value: Response) => (void | PromiseLike<void>)) {
	return async (res) => {
		if (res.ok && res.status !== 204) {
			const body = await res.json();
			resolve(body);
		} else if (res.status === 204) {
			resolve(undefined as _ResT); // void -> undefined
		} else {
			// エラー応答で JSON.parse に失敗した場合は HTTP ステータスコードとメッセージを返す
			const body = await res
				.json()
				.catch(() => ({ statusCode: res.status, message: res.statusText }));
			reject(typeof body.error === 'object' ? body.error : body);
		}
	};
}

// Implements Misskey.api.ApiClient.request
export function misskeyApi<
	ResT = void,
	E extends keyof Misskey.Endpoints = keyof Misskey.Endpoints,
	P extends Misskey.Endpoints[E]['req'] = Misskey.Endpoints[E]['req'],
	_ResT = ResT extends void ? Misskey.api.SwitchCaseResponseType<E, P> : ResT,
>(
	endpoint: E,
	data: P = {} as any,
	token?: string | null | undefined,
	signal?: AbortSignal,
	initiator: string = 'misskey',
): Promise<_ResT> {
	if (endpoint.includes('://')) throw new Error('invalid endpoint');
	pendingApiRequestsCount.value++;

	const credential = token ? token : $i ? $i.token : undefined;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const promise = new Promise<_ResT>((resolve, reject) => {
		// Send request
		const initiateTime = Date.now();
		window.fetch(`${apiUrl}/${endpoint}`, {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'omit',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': credential ? `Bearer ${credential}` : 'anonymous',
				'X-Client-Transaction-Id': generateClientTransactionId(initiator),
			},
			signal,
		}).then(res => {
			if (instance.googleAnalyticsId) {
				gtagTime({
					name: 'api',
					event_category: `/${endpoint}`,
					value: Date.now() - initiateTime,
				});
			}
			return res;
		}).then(handleResponse(resolve, reject)).catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
}

// Implements Misskey.api.ApiClient.request
export function misskeyApiGet<
	ResT = void,
	E extends keyof Misskey.Endpoints = keyof Misskey.Endpoints,
	P extends Misskey.Endpoints[E]['req'] = Misskey.Endpoints[E]['req'],
	_ResT = ResT extends void ? Misskey.api.SwitchCaseResponseType<E, P> : ResT,
>(
	endpoint: E,
	data: P = {} as any,
	initiator: string = 'misskey',
): Promise<_ResT> {
	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const query = new URLSearchParams(data as any);

	const promise = new Promise<_ResT>((resolve, reject) => {
		// Send request
		const initiateTime = Date.now();
		window.fetch(`${apiUrl}/${endpoint}?${query}`, {
			method: 'GET',
			credentials: 'omit',
			headers: {
				'Authorization': 'anonymous',
				'X-Client-Transaction-Id': generateClientTransactionId(initiator),
			},
		}).then(res => {
			if (instance.googleAnalyticsId) {
				gtagTime({
					name: 'api-get',
					event_category: `/${endpoint}?${query}`,
					value: Date.now() - initiateTime,
				});
			}
			return res;
		}).then(handleResponse(resolve, reject)).catch(reject);
	});

	promise.then(onFinally, onFinally);

	return promise;
}
