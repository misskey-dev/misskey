/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RegistryApiService } from '@/core/RegistryApiService.js';

export const meta = {
	requireCredential: true,
	kind: 'write:account',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		key: { type: 'string', minLength: 1 },
		value: {},
		scope: { type: 'array', default: [], items: {
			type: 'string', pattern: /^[a-zA-Z0-9_]+$/.toString().slice(1, -1),
		} },
		domain: { type: 'string', nullable: true },
	},
	required: ['key', 'value', 'scope'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private registryApiService: RegistryApiService,
	) {
		super(meta, paramDef, async (ps, me, accessToken) => {
			await this.registryApiService.set(me.id, accessToken ? accessToken.id : (ps.domain ?? null), ps.scope, ps.key, ps.value);
		});
	}
}
