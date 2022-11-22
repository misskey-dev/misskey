import { Inject, Injectable } from '@nestjs/common';
import { IdService } from '@/core/IdService.js';
import type { SwSubscriptionsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	description: 'Check push notification registration exists.',

	res: {
		type: 'object',
		optional: false, nullable: true,
		properties: {
			state: {
				type: 'string',
				optional: true, nullable: false,
				enum: ['already-subscribed'],
			},
			key: {
				type: 'string',
				optional: false, nullable: true,
			},
		},
	},
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

		private idService: IdService,
		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// if already subscribed
			const exist = await this.swSubscriptionsRepository.findOneBy({
				userId: me.id,
				endpoint: ps.endpoint,
			});

			const instance = await this.metaService.fetch(true);

			if (exist != null) {
				return {
					state: 'already-subscribed' as const,
					key: instance.swPublicKey,
				};
			}

			return null;
		});
	}
}
