/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import { MetaEntityService } from '@/core/entities/MetaEntityService.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: {
		type: 'object',
		oneOf: [
			{ type: 'object', ref: 'MetaLite' },
			{ type: 'object', ref: 'MetaDetailed' },
		],
	},
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		detail: { type: 'boolean', default: true },
	},
	required: [],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private metaEntityService: MetaEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return ps.detail ? await this.metaEntityService.packDetailed() : await this.metaEntityService.pack();
		});
	}
}
