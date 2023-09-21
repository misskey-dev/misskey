/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/_.js';
import { RoleService } from '@/core/RoleService.js';
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
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '5eb8d909-2540-4970-90b8-dd6f86088121',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		inviteId: { type: 'string', format: 'misskey:id' },
	},
	required: ['inviteId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const ticket = await this.registrationTicketsRepository.findOneBy({ id: ps.inviteId });
			const isModerator = await this.roleService.isModerator(me);

			if (ticket == null) {
				throw new ApiError(meta.errors.noSuchCode);
			}

			if (ticket.createdById !== me.id && !isModerator) {
				throw new ApiError(meta.errors.accessDenied);
			}

			if (ticket.usedAt && !isModerator) {
				throw new ApiError(meta.errors.cantDelete);
			}

			await this.registrationTicketsRepository.delete(ticket.id);
		});
	}
}
