/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { ValidatableSchema } from '@/misc/json-schema.js';
import { ApResolverService } from '@/core/activitypub/ApResolverService.js';

export const meta = {
	tags: ['federation'],

	requireCredential: true,
	kind: 'read:federation',

	limit: {
		duration: ms('1hour'),
		max: 30,
	},

	errors: {
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		uri: { type: 'string' },
	},
	required: ['uri'],
} as const satisfies ValidatableSchema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private apResolverService: ApResolverService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const resolver = this.apResolverService.createResolver();
			const object = await resolver.resolve(ps.uri);
			return object;
		});
	}
}
