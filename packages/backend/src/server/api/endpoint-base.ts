/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as v from 'valibot';
import { toInvalidParamInfo } from '@/misc/schema/error.js';
import type { AnyValibotSchema } from '@/misc/schema/introspect.js';
import type { MiLocalUser } from '@/models/User.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import { ApiError } from './error.js';
import type { IEndpointMeta } from './endpoints.js';

export type Response = Record<string, any> | void;

type File = {
	name: string | null;
	path: string;
};

type Executor<T extends IEndpointMeta, Ps extends AnyValibotSchema> =
	(params: v.InferOutput<Ps>, user: T['requireCredential'] extends true ? MiLocalUser : MiLocalUser | null, token: MiAccessToken | null, file?: File, cleanup?: () => any, ip?: string | null, headers?: Record<string, string> | null) =>
		Promise<T['res'] extends undefined ? Response : v.InferOutput<NonNullable<T['res']>>>;

/** paramDef による検証結果。成功時の `value` が `cb` に渡される値になる */
type ValidationResult =
	{ ok: true, value: unknown } |
	{ ok: false, error: ApiError };

type Validator = (params: unknown) => ValidationResult;

function invalidParamError(info: Record<string, unknown>): ApiError {
	return new ApiError({
		message: 'Invalid param.',
		code: 'INVALID_PARAM',
		id: '3d81ceae-475f-4600-b2a8-2bc116157532',
	}, info);
}

/**
 * paramDef 用の validator。
 *
 * `v.safeParse()` の出力 (default 適用済みの **新しいオブジェクト**) をハンドラに渡す。
 */
function makeValidator(paramDef: AnyValibotSchema): Validator {
	return (params: unknown) => {
		const result = v.safeParse(paramDef, params);
		if (!result.success) {
			return { ok: false, error: invalidParamError(toInvalidParamInfo(result.issues)) };
		}
		return { ok: true, value: result.output };
	};
}

export abstract class Endpoint<T extends IEndpointMeta, Ps extends AnyValibotSchema> {
	public exec: (params: any, user: T['requireCredential'] extends true ? MiLocalUser : MiLocalUser | null, token: MiAccessToken | null, file?: File, ip?: string | null, headers?: Record<string, string> | null) => Promise<any>;

	constructor(meta: T, paramDef: Ps, cb: Executor<T, Ps>) {
		const validate: Validator = makeValidator(paramDef);

		this.exec = (params: any, user: T['requireCredential'] extends true ? MiLocalUser : MiLocalUser | null, token: MiAccessToken | null, file?: File, ip?: string | null, headers?: Record<string, string> | null) => {
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

			const result = validate(params);
			if (!result.ok) {
				if (file) cleanup!();

				return Promise.reject(result.error);
			}

			return cb(result.value as v.InferOutput<Ps>, user, token, file, cleanup, ip, headers);
		};
	}
}
