import type { Endpoints } from './api.types.js';

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

type IsNeverType<T> = [T] extends [never] ? true : false;

type StrictExtract<Union, Cond> = Cond extends Union ? Union : never;

type IsCaseMatched<E extends keyof Endpoints, P extends Endpoints[E]['req'], C extends number> =
	IsNeverType<StrictExtract<Endpoints[E]['res']['$switch']['$cases'][C], [P, any]>> extends false ? true : false;

type GetCaseResult<E extends keyof Endpoints, P extends Endpoints[E]['req'], C extends number> =
	StrictExtract<Endpoints[E]['res']['$switch']['$cases'][C], [P, any]>[1];

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

	public request<E extends keyof Endpoints, P extends Endpoints[E]['req']>(
		endpoint: E, params: P = {} as P, credential?: string | null | undefined,
	): Promise<Endpoints[E]['res'] extends { $switch: { $cases: [any, any][]; $default: any; }; }
		?
			IsCaseMatched<E, P, 0> extends true ? GetCaseResult<E, P, 0> :
			IsCaseMatched<E, P, 1> extends true ? GetCaseResult<E, P, 1> :
			IsCaseMatched<E, P, 2> extends true ? GetCaseResult<E, P, 2> :
			IsCaseMatched<E, P, 3> extends true ? GetCaseResult<E, P, 3> :
			IsCaseMatched<E, P, 4> extends true ? GetCaseResult<E, P, 4> :
			IsCaseMatched<E, P, 5> extends true ? GetCaseResult<E, P, 5> :
			IsCaseMatched<E, P, 6> extends true ? GetCaseResult<E, P, 6> :
			IsCaseMatched<E, P, 7> extends true ? GetCaseResult<E, P, 7> :
			IsCaseMatched<E, P, 8> extends true ? GetCaseResult<E, P, 8> :
			IsCaseMatched<E, P, 9> extends true ? GetCaseResult<E, P, 9> :
			Endpoints[E]['res']['$switch']['$default']
		: Endpoints[E]['res']>
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
