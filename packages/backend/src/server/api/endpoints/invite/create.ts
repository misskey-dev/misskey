import { MoreThan } from 'typeorm';
import rndstr from 'rndstr';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/index.js';
import { InviteCodeEntityService } from '@/core/entities/InviteCodeEntityService.js';
import { IdService } from '@/core/IdService.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requireRolePolicy: 'canInvite',

	errors: {
		exceededCreateLimit: {
			message: 'You have exceeded the limit for creating an invitation code.',
			code: 'EXCEEDED_LIMIT_OF_CREATE_INVITE_CODE',
			id: '8b165dd3-6f37-4557-8db1-73175d63c641',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			code: {
				type: 'string',
				optional: false, nullable: false,
				example: 'GR6S02ERUA5VR',
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

		private inviteCodeEntityService: InviteCodeEntityService,
		private idService: IdService,
		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.metaService.fetch(true);

			// 一人あたりが発行できるチケットの数を制限
			if (instance.inviteCodeCreateLimit) {
				const count = await this.registrationTicketsRepository.countBy({
					createdAt: MoreThan(new Date(Date.now() - instance.inviteCodeCreateLimitResetCycle)),
					createdBy: {
						id: me.id,
					},
				});

				if (count >= instance.inviteCodeCreateLimit) {
					throw new ApiError(meta.errors.exceededCreateLimit);
				}
			}
			
			const code = rndstr({
				length: 8,
				chars: '2-9A-HJ-NP-Z', // [0-9A-Z] w/o [01IO] (32 patterns)
			}) + (Math.floor(Date.now() / 1000 / 60)).toString(36).toUpperCase();

			const ticket = await this.registrationTicketsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				createdBy: me,
				expiresAt: instance.inviteCodeExpirationTime ? new Date(Date.now() + instance.inviteCodeExpirationTime) : null,
				pendingUserId: null,
				code,
			}).then(x => this.registrationTicketsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.inviteCodeEntityService.pack(ticket, me);
		});
	}
}
