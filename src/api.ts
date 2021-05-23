import { Endpoints } from './endpoints';

const MK_API_ERROR = Symbol();

export type APIError = {
	id: string;
	code: string;
	message: string;
	kind: 'client' | 'server';
	info: Record<string, any>;
};

export function isAPIError(reason: any): reason is APIError {
	return reason[MK_API_ERROR] === true;
}

export class APIClient {
	public origin: string;
	public credential: string | null | undefined;
	public fetch: (typeof fetch);

	constructor(opts: {
		origin: APIClient['origin'];
		credential?: APIClient['credential'];
		fetch?: APIClient['fetch'] | null | undefined;
	}) {
		this.origin = opts.origin;
		this.credential = opts.credential;
		this.fetch = opts.fetch || fetch;
	}

	public request<E extends keyof Endpoints>(
		endpoint: E, data: Endpoints[E]['req'] = {}, credential?: string | null | undefined,
	): Promise<Endpoints[E]['res']> {
		const promise = new Promise<Endpoints[E]['res']>((resolve, reject) => {
			this.fetch(`${this.origin}/api/${endpoint}`, {
				method: 'POST',
				body: JSON.stringify({
					...data,
					i: credential !== undefined ? credential : this.credential
				}),
				credentials: 'omit',
				cache: 'no-cache'
			}).then(async (res) => {
				const body = res.status === 204 ? null : await res.json();
	
				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve(null);
				} else {
					reject({
						[MK_API_ERROR]: true,
						...body.error
					});
				}
			}).catch(reject);
		});
	
		return promise;
	}
}
