import { Endpoints } from './endpoints';

export type APIError = {
	id: string;
	code: string;
	message: string;
	kind: 'client' | 'server';
	info: Record<string, any>;
};

export function request<E extends keyof Endpoints>(
	origin: string,
	endpoint: E,
	data: Endpoints[E]['req'] = {},
	credential: string | null | undefined,
): Promise<Endpoints[E]['res']> {
	const promise = new Promise<Endpoints[E]['res']>((resolve, reject) => {
		// Append a credential
		if (credential !== undefined) (data as Record<string, any>).i = credential;

		// Send request
		fetch(`${origin}/api/${endpoint}`, {
			method: 'POST',
			body: JSON.stringify(data),
			credentials: 'omit',
			cache: 'no-cache'
		}).then(async (res) => {
			const body = res.status === 204 ? null : await res.json();

			if (res.status === 200) {
				resolve(body);
			} else if (res.status === 204) {
				resolve(null);
			} else {
				reject(body.error);
			}
		}).catch(reject);
	});

	return promise;
}

export class APIClient {
	public i: { token: string; } | null = null;
	private origin: string;

	constructor(opts: {
		origin: APIClient['origin'];
	}) {
		this.origin = opts.origin;
	}

	public request<E extends keyof Endpoints>(
		endpoint: E, data: Endpoints[E]['req'] = {}, credential?: string | null | undefined,
	): Promise<Endpoints[E]['res']> {
		return request(this.origin, endpoint, data, credential === undefined ? this.i?.token : credential);
	}
}
