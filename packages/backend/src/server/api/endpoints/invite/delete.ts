import { MoreThan } from 'typeorm';
import rndstr from 'rndstr';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { MetaService } from '@/core/MetaService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requireRolePolicy: 'canInvite',

	errors: {
		noSuchCode: {
			message: 'No such invite code.',
			code: 'NO_SUCH_INVITE_CODE',
			id: 'cd4f9ae4-7854-4e3e-8df9-c296f051e634',
		},
		cantDelete: {
			message: 'You can\'t delete this invite code.',
			code: 'CAN_NOT_DELETE_INVITE_CODE',
			id: 'ff17af39-000c-4d4e-abdf-848fa30fc1ce',
		}
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		inviteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['inviteId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const ticket = await this.registrationTicketsRepository.findOneBy({
				id: ps.inviteId,
				createdBy: {
					id: me.id,
				},
			});

			if (ticket == null) {
				throw new ApiError(meta.errors.noSuchCode);
			}

			if (ticket.usedAt) {
				throw new ApiError(meta.errors.cantDelete);
			}

			await this.registrationTicketsRepository.delete(ticket.id);
		});
	}
}
