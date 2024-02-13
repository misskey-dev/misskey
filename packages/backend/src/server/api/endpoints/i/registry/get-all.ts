/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RegistryApiService } from '@/core/RegistryApiService.js';

export const meta = {
	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		scope: { type: 'array', default: [], items: {
			type: 'string', pattern: /^[a-zA-Z0-9_]+$/.toString().slice(1, -1),
		} },
		domain: { type: 'string', nullable: true },
	},
	required: ['scope'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, paramDef, async (ps, me, accessToken) => {
			const items = await this.registryApiService.getAllItemsOfScope(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope);

			const res = {} as Record<string, any>;

			for (const item of items) {
				res[item.key] = item.value;
			}

			return res;
		});
	}
}
