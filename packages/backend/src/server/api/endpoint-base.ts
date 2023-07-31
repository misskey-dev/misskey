/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import _Ajv from 'ajv';
import type { Schema, SchemaType } from '@/misc/json-schema.js';
import type { LocalUser } from '@/models/entities/User.js';
import type { AccessToken } from '@/models/entities/AccessToken.js';
import { ApiError } from './error.js';
import type { IEndpointMeta } from './endpoints.js';

const Ajv = _Ajv.default;

const ajv = new Ajv({
	useDefaults: true,
});

ajv.addFormat('misskey:id', /^[a-zA-Z0-9]+$/);

export type Response = Record<string, any> | void;

type File = {
	name: string | null;
	path: string;
};

// TODO: paramsの型をT['params']のスキーマ定義から推論する
type Executor<T extends IEndpointMeta, Ps extends Schema> =
	(params: SchemaType<Ps>, user: T['requireCredential'] extends true ? LocalUser : LocalUser | null, token: AccessToken | null, file?: File, cleanup?: () => any, ip?: string | null, headers?: Record<string, string> | null) =>
		Promise<T['res'] extends undefined ? Response : SchemaType<NonNullable<T['res']>>>;

export abstract class Endpoint<T extends IEndpointMeta, Ps extends Schema> {
	public exec: (params: any, user: T['requireCredential'] extends true ? LocalUser : LocalUser | null, token: AccessToken | null, file?: File, ip?: string | null, headers?: Record<string, string> | null) => Promise<any>;

	constructor(meta: T, paramDef: Ps, cb: Executor<T, Ps>) {
		const validate = ajv.compile(paramDef);

		this.exec = (params: any, user: T['requireCredential'] extends true ? LocalUser : LocalUser | null, token: AccessToken | null, file?: File, ip?: string | null, headers?: Record<string, string> | null) => {
			let cleanup: undefined | (() => void) = undefined;

			if (meta.requireFile) {
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

			return cb(params as SchemaType<Ps>, user, token, file, cleanup, ip, headers);
		};
	}
}
