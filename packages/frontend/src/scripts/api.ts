import * as Misskey from 'misskey-js';
import { apiUrl, url } from '@/config';
import { $i } from '@/account';
export const pendingApiRequestsCount = ref(0);

const apiClient = new Misskey.api.APIClient({
	origin: url,
});

export const api = ((endpoint: string, data: Record<string, any> = {}, token?: string | null | undefined) => {
	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const promise = new Promise((resolve, reject) => {
		// Append a credential
		if ($i) (data as any).i = $i.token;
		if (token !== undefined) (data as any).i = token;

		// Send request
		window.fetch(endpoint.indexOf('://') > -1 ? endpoint : `${apiUrl}/${endpoint}`, {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'omit',
			cache: 'no-cache',
			headers: {
				'Content-Type': 'application/json',
			},
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
}) as typeof apiClient.request;

export const apiGet = ((endpoint: string, data: Record<string, any> = {}) => {
	pendingApiRequestsCount.value++;

	const onFinally = () => {
		pendingApiRequestsCount.value--;
	};

	const query = new URLSearchParams(data);

	const promise = new Promise((resolve, reject) => {
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

	return promise;
}) as typeof apiClient.request;
