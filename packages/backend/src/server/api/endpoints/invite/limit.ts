import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/index.js';
import { InviteCodeEntityService } from '@/core/entities/InviteCodeEntityService.js';
import { QueryService } from '@/core/QueryService.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';
import { MoreThan } from 'typeorm';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requireRolePolicy: 'canInvite',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			remaining: {
				type: 'integer',
				optional: false, nullable: true,
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

		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.metaService.fetch(true);

			const count = instance.inviteCodeCreateLimit ? await this.registrationTicketsRepository.countBy({
				createdAt: MoreThan(new Date(Date.now() - instance.inviteCodeCreateLimitResetCycle)),
				createdBy: {
					id: me.id,
				},
			}) : null;

			return {
				remaining: instance.inviteCodeCreateLimit && count ? instance.inviteCodeCreateLimit - count : null,
			};
		});
	}
}
