import type { Endpoints, SchemaOrUndefined, ResponseOf, IEndpointMeta } from 'misskey-js/built/endpoints.types';
import { ref } from 'vue';
import { apiUrl } from '@/config';
import { $i } from '@/account';
export const pendingApiRequestsCount = ref(0);

// Implements Misskey.api.ApiClient.request
export function api<E extends keyof Endpoints, P extends SchemaOrUndefined<Endpoints[E]['defines'][number]['req']>, M extends IEndpointMeta = Endpoints[E]>(
	endpoint: E, params?: P, token?: string | null | undefined, signal?: AbortSignal
): Promise<ResponseOf<M, P>> {
	const data: (P | Record<string, any>) & { i?: string | null } = params ?? {};

	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const promise = new Promise<ResponseOf<M, P> | void>((resolve, reject) => {
		// Append a credential
		if ($i) data.i = $i.token;
		if (token !== undefined) data.i = token;

		// Send request
		window.fetch(endpoint.indexOf('://') > -1 ? endpoint : `${apiUrl}/${endpoint}`, {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'omit',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json',
			},
			signal,
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

	return promise as Promise<ResponseOf<M, P>>;
}

// Implements Misskey.api.ApiClient.request
export function apiGet<E extends keyof Endpoints, P extends SchemaOrUndefined<Endpoints[E]['defines'][number]['req']>, M extends IEndpointMeta = Endpoints[E]>(
	endpoint: E, params?: P, token?: string | null | undefined, signal?: AbortSignal
): Promise<ResponseOf<M, P>> {
	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const query = new URLSearchParams((params ?? {}) as Record<string, string>);

	const promise = new Promise<ResponseOf<M, P> | void>((resolve, reject) => {
		// Send request
		window.fetch(`${apiUrl}/${endpoint}?${query}`, {
			method: 'GET',
			credentials: 'omit',
			cache: 'default',
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

	return promise as Promise<ResponseOf<M, P>>;
}
