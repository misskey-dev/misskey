import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IndieAuthClientsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:indie-auth',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
			},
			createdAt: {
				type: 'string',
				optional: false, nullable: false,
				format: 'date-time',
			},
			name: {
				type: 'string',
				optional: false, nullable: true,
			},
			redirectUris: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', minLength: 1 },
		name: { type: 'string', nullable: true },
		redirectUris: {
			type: 'array', minItems: 1,
			items: { type: 'string' },
		},
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.indieAuthClientsRepository)
		private indieAuthClientsRepository: IndieAuthClientsRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const indieAuthClient = await this.indieAuthClientsRepository.insert({
				id: ps.id,
				createdAt: new Date(),
				name: ps.name ? ps.name : null,
				redirectUris: ps.redirectUris,
			}).then(r => this.indieAuthClientsRepository.findOneByOrFail({ id: r.identifiers[0].id }));

			this.moderationLogService.log(me, 'createIndieAuthClient', {
				clientId: indieAuthClient.id,
				client: indieAuthClient,
			});

			return {
				id: indieAuthClient.id,
				createdAt: indieAuthClient.createdAt.toISOString(),
				name: indieAuthClient.name,
				redirectUris: indieAuthClient.redirectUris,
			};
		});
	}
}
