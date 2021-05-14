import { Endpoints } from './endpoints';

export class APIClient {
	public i: { token: string; } | null = null;
	private apiUrl: string;

	constructor(opts: {
		apiUrl: APIClient['apiUrl'];
	}) {
		this.apiUrl = opts.apiUrl;
	}

	public request<E extends keyof Endpoints>(
		endpoint: E, data: Endpoints[E]['req'] = {}, token?: string | null | undefined
	): Promise<Endpoints[E]['res']> {
		const promise = new Promise<Endpoints[E]['res']>((resolve, reject) => {
			// Append a credential
			if (this.i) (data as Record<string, any>).i = this.i.token;
			if (token !== undefined) (data as Record<string, any>).i = token;
	
			// Send request
			fetch(endpoint.indexOf('://') > -1 ? endpoint : `${this.apiUrl}/${endpoint}`, {
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
}
