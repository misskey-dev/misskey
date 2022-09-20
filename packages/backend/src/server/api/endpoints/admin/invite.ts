import rndstr from 'rndstr';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			code: {
				type: 'string',
				optional: false, nullable: false,
				example: '2ERUA5VR',
				maxLength: 8,
				minLength: 8,
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
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async () => {
			const code = rndstr({
				length: 8,
				chars: '2-9A-HJ-NP-Z', // [0-9A-Z] w/o [01IO] (32 patterns)
			});

			await this.registrationTicketsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				code,
			});

			return {
				code,
			};
		});
	}
}
