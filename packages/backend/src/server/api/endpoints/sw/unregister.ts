import { Inject, Injectable } from '@nestjs/common';
import type { SwSubscriptionsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account'],

	requireCredential: false,

	description: 'Unregister from receiving push notifications.',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		endpoint: { type: 'string' },
	},
	required: ['endpoint'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.swSubscriptionsRepository)
		private swSubscriptionsRepository: SwSubscriptionsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			await this.swSubscriptionsRepository.delete({
				...(me ? { userId: me.id } : {}),
				endpoint: ps.endpoint,
			});
		});
	}
}
