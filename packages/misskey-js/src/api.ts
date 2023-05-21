import type { Endpoints, SchemaOrUndefined, IEndpointMeta, EndpointDefines } from './endpoints.types';

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
		headers: {[key in string]: string}
	}) => Promise<{
		status: number;
		json(): Promise<any>;
	}>;

type Response<D extends IEndpointMeta, P extends SchemaOrUndefined<D['defines'][number]['req']>, DD extends EndpointDefines[number] = D['defines'][number]> =
	P extends DD['req'] ? SchemaOrUndefined<DD['res']> : never;

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
		// ネイティブ関数をそのまま変数に代入して使おうとするとChromiumではIllegal invocationエラーが発生するため、
		// 環境で実装されているfetchを使う場合は無名関数でラップして使用する
		this.fetch = opts.fetch ?? ((...args) => fetch(...args));
	}

	public request<E extends keyof Endpoints, P extends SchemaOrUndefined<D['defines'][number]['req']>, D extends IEndpointMeta = Endpoints[E], R = Response<D, P>>(
		endpoint: E, params: P = {} as P, credential?: string | null | undefined,
	): Promise<R>
	{
		const promise = new Promise((resolve, reject) => {
			this.fetch(`${this.origin}/api/${endpoint}`, {
				method: 'POST',
				body: JSON.stringify({
					...params,
					i: credential !== undefined ? credential : this.credential,
				}),
				headers: {
					'Content-Type': 'application/json',
				},
				credentials: 'omit',
				cache: 'no-cache',
			}).then(async (res) => {
				const body = res.status === 204 ? null : await res.json();

				if (res.status === 200) {
					resolve(body);
				} else if (res.status === 204) {
					resolve(null);
				} else {
					reject({
						[MK_API_ERROR]: true,
						...body.error,
					});
				}
			}).catch(reject);
		});

		return promise as any;
	}
}
