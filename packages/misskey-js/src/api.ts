import './autogen/apiClientJSDoc.js';

import { SwitchCaseResponseType } from './api.types.js';
import type { Endpoints } from './api.types.js';

export type {
	SwitchCaseResponseType,
} from './api.types.js';

const MK_API_ERROR = Symbol();

export class APIError<ER extends Endpoints[keyof Endpoints]['errors'] = {}> extends Error {

	public payload;
	public readonly [MK_API_ERROR] = true;

	constructor(response: ER extends Record<string, never> ? {
		id: string;
		code: string;
		message: string;
		kind: 'client' | 'server';
		info: Record<string, any>;
	} : ER) {
		super('message' in response ? response.message : 'API Error');
		this.payload = response;
	}
}

export function isAPIError<ER extends Endpoints[keyof Endpoints]['errors']>(reason: any): reason is APIError<ER> {
	return reason instanceof Error && MK_API_ERROR in reason;
}

export type FetchLike = (input: string, init?: {
	method?: string;
	body?: string;
	credentials?: RequestCredentials;
	cache?: RequestCache;
	headers: { [key in string]: string }
}) => Promise<{
	status: number;
	json(): Promise<any>;
}>;

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


	public request<E extends keyof Endpoints, P extends Endpoints[E]['req'], ER extends Endpoints[E]['errors']>(
		endpoint: E,
		params: P = {} as P,
		credential?: string | null,
	): Promise<SwitchCaseResponseType<E, P>> {
		return new Promise((resolve, reject) => {
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

				if (res.status === 200 || res.status === 204) {
					resolve(body);
				} else {
					reject(new APIError<ER>(body.error));
				}
			}).catch((reason) => {
				reject(new Error(reason));
			});
		});
	}
}
