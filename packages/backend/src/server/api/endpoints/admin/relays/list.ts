import { Inject, Injectable } from '@/di-decorators.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { RelayService } from '@/core/RelayService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				inbox: {
					type: 'string',
					optional: false, nullable: false,
					format: 'url',
				},
				status: {
					type: 'string',
					optional: false, nullable: false,
					default: 'requesting',
					enum: [
						'requesting',
						'accepted',
						'rejected',
					],
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.RelayService)
		private relayService: RelayService,
	) {
		super(meta, paramDef, async (ps, me) => {
			return await this.relayService.listRelay();
		});
	}
}
