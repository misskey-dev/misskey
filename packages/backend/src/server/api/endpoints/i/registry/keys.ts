/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { RegistryApiService } from '@/core/RegistryApiService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		items: {
			type: 'string',
		},
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
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, paramDef, async (ps, me, accessToken) => {
			return await this.registryApiService.getAllKeysOfScope(me.id, accessToken != null ? accessToken.id : (ps.domain ?? null), ps.scope);
		});
	}
}
