import rndstr from 'rndstr';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	errors: {
		invalidDateTime: {
			message: 'Invalid date-time format',
			code: 'INVALID_DATE_TIME',
			id: 'f1380b15-3760-4c6c-a1db-5c3aaf1cbd49',
		},
	},

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'string',
			optional: false, nullable: false,
			example: 'GR6S02ERUA5VR',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		count: { type: 'integer', minimum: 1, maximum: 100, default: 1 },
		expiresAt: { type: 'string' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.expiresAt && isNaN(Date.parse(ps.expiresAt))) {
				throw new ApiError(meta.errors.invalidDateTime);
			}

			const ticketsPromises = [];

			for (let i = 0; i < ps.count; i++) {
				const code = rndstr({
					length: 8,
					chars: '2-9A-HJ-NP-Z', // [0-9A-Z] w/o [01IO] (32 patterns)
				}) + (Math.floor(Date.now() / 1000 / 60)).toString(36).toUpperCase();

				ticketsPromises.push(this.registrationTicketsRepository.insert({
					id: this.idService.genId(),
					createdAt: new Date(),
					expiresAt: ps.expiresAt ? new Date(ps.expiresAt) : null,
					code,
				}).then(x => this.registrationTicketsRepository.findOneByOrFail(x.identifiers[0])));
			}

			const tickets = await Promise.all(ticketsPromises);
			return tickets.map(x => x.code);
		});
	}
}
