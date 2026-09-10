/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RegistryApiService } from '@/core/RegistryApiService.js';

export const meta = {
	requireCredential: true,
	kind: 'read:account',

	res: v.record(v.string(), v.string()),
} as const;

export const paramDef = v.object({
	scope: v.optional(v.array(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_]+$/))), []),
	domain: v.nullish(v.string()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, paramDef, async (ps, me, accessToken) => {
			const items = await this.registryApiService.getAllItemsOfScope(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope);

			const res = {} as Record<string, string>;

			for (const item of items) {
				const type = typeof item.value;
				res[item.key] =
					item.value === null ? 'null' :
					Array.isArray(item.value) ? 'array' :
					type === 'number' ? 'number' :
					type === 'string' ? 'string' :
					type === 'boolean' ? 'boolean' :
					type === 'object' ? 'object' :
					null as never;
			}

			return res;
		});
	}
}
