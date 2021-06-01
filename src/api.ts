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

export type FetchLike = (input: string, init?: {
		method?: string;
		body?: string;
		credentials?: RequestCredentials;
		cache?: RequestCache;
	}) => Promise<{
		status: number;
		json(): Promise<any>;
	}>;

type IsNeverType<T> = [T] extends [never] ? true : false;

type StrictExtract<Union, Cond> = Cond extends Union ? Union : never;

export class APIClient {
	public origin: string;
	public credential: string | null | undefined;
	public fetch: FetchLike;

	constructor(opts: {
		origin: APIClient['origin'];
		credential?: APIClient['credential'];
		fetch?: APIClient['fetch'] | null | undefined;
	}) {
		this.origin = opts.origin;
		this.credential = opts.credential;
		this.fetch = opts.fetch || fetch;
	}

	public request<E extends keyof Endpoints, P extends Endpoints[E]['req']>(
		endpoint: E, params: P = {} as P, credential?: string | null | undefined,
	): Promise<Endpoints[E]['res'] extends { $switch: { $cases: [any, any][]; $default: any; }; }
		? IsNeverType<StrictExtract<Endpoints[E]['res']['$switch']['$cases'][number], [P, any]>> extends true
			? Endpoints[E]['res']['$switch']['$default']
			: StrictExtract<Endpoints[E]['res']['$switch']['$cases'][number], [P, any]>[1]
		: Endpoints[E]['res']>
	{
		const promise = new Promise((resolve, reject) => {
			this.fetch(`${this.origin}/api/${endpoint}`, {
				method: 'POST',
				body: JSON.stringify({
					...params,
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
	
		return promise as any;
	}
}
