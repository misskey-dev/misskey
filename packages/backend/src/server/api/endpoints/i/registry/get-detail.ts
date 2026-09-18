/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RegistryApiService } from '@/core/RegistryApiService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	requireCredential: true,
	kind: 'read:account',

	errors: {
		noSuchKey: {
			message: 'No such key.',
			code: 'NO_SUCH_KEY',
			id: '97a1e8e7-c0f7-47d2-957a-92e61256e01a',
		},
	},

	res: v.object({
		updatedAt: v.string(),
		// json-schema 側も型未指定で無検証だったため、意味を変えないよう v.any() を維持
		value: v.any(),
	}),
} as const;

export const paramDef = v.object({
	key: v.string(),
	scope: v.optional(v.array(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_]+$/))), []),
	domain: v.nullish(v.string()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, paramDef, async (ps, me, accessToken) => {
			const item = await this.registryApiService.getItem(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope, ps.key);

			if (item == null) {
				throw new ApiError(meta.errors.noSuchKey);
			}

			return {
				updatedAt: item.updatedAt.toISOString(),
				value: item.value,
			};
		});
	}
}
