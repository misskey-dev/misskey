import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { MetaService } from '@/core/MetaService.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		policies: {
			type: 'object',
		},
	},
	required: [
		'policies',
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private metaService: MetaService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps) => {
			await this.metaService.update({
				policies: ps.policies,
			});
			this.globalEventService.publishInternalEvent('policiesUpdated', ps.policies);
		});
	}
}
