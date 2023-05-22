import * as fs from 'node:fs';
import Ajv from 'ajv';
import type { LocalUser } from '@/models/entities/User.js';
import type { AccessToken } from '@/models/entities/AccessToken.js';
import { ApiError } from './error.js';
import { endpoints } from 'misskey-js/built/endpoints.js';
import type { IEndpointMeta, ResponseOf, SchemaOrUndefined } from 'misskey-js/built/endpoints.types.js';
import type { Endpoints } from 'misskey-js';
import { WeakSerialized } from 'schema-type';

const ajv = new Ajv({
	useDefaults: true,
});

ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);

export type Response = Record<string, any> | void;

type File = {
	name: string | null;
	path: string;
};

export type Executor<T extends IEndpointMeta, P = SchemaOrUndefined<T['defines'][number]['req']>> =
	(
		params: P,
		user: LocalUser | (T['requireCredential'] extends true ? never : null),
		token: AccessToken | null,
		file?: File,
		cleanup?: () => any,
		ip?: string | null,
		headers?: Record<string, string> | null
	) => Promise<WeakSerialized<ResponseOf<T, P>>>;

// ExecutorWrapperの型はあえて緩くしておく
export type ExecutorWrapper =
	(
		params: any,
		user: LocalUser | null,
		token: AccessToken | null,
		file?: File,
		ip?: string | null,
		headers?: Record<string, string> | null
	) => Promise<any>;

export abstract class Endpoint<E extends keyof Endpoints, T extends IEndpointMeta = Endpoints[E]> {
	public readonly name: E;
	public readonly meta: Endpoints[E];
	public exec: ExecutorWrapper;

	constructor(cb: Executor<T>) {
		this.meta = endpoints[this.name];
		const validate = ajv.compile({ oneOf: this.meta.defines.map(d => d.req) });

		this.exec = (params, user, token, file, ip, headers) => {
			let cleanup: undefined | (() => void) = undefined;
	
			if (this.meta.requireFile) {
				cleanup = () => {
					if (file) fs.unlink(file.path, () => {});
				};
	
				if (file == null) return Promise.reject(new ApiError({
					message: 'File required.',
					code: 'FILE_REQUIRED',
					id: '4267801e-70d1-416a-b011-4ee502885d8b',
				}));
			}
	
			const valid = validate(params);
			if (!valid) {
				if (file) cleanup!();
	
				const errors = validate.errors!;
				const err = new ApiError({
					message: 'Invalid param.',
					code: 'INVALID_PARAM',
					id: '3d81ceae-475f-4600-b2a8-2bc116157532',
				}, {
					param: errors[0].schemaPath,
					reason: errors[0].message,
				});
				return Promise.reject(err);
			}

			return cb(params as any, user as any, token, file, cleanup, ip, headers);
		};
	}
}
