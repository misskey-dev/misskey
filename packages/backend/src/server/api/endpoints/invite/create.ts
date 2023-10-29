/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { MoreThan } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/_.js';
import { InviteCodeEntityService } from '@/core/entities/InviteCodeEntityService.js';
import { IdService } from '@/core/IdService.js';
import { RoleService } from '@/core/RoleService.js';
import { DI } from '@/di-symbols.js';
import { generateInviteCode } from '@/misc/generate-invite-code.js';
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

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private inviteCodeEntityService: InviteCodeEntityService,
		private idService: IdService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);

			if (policies.inviteLimit) {
				const count = await this.registrationTicketsRepository.countBy({
					id: MoreThan(this.idService.gen(Date.now() - (policies.inviteLimitCycle * 1000 * 60))),
					createdById: me.id,
				});

				if (count >= policies.inviteLimit) {
					throw new ApiError(meta.errors.exceededCreateLimit);
				}
			}

			const ticket = await this.registrationTicketsRepository.insert({
				id: this.idService.gen(),
				createdBy: me,
				createdById: me.id,
				expiresAt: policies.inviteExpirationTime ? new Date(Date.now() + (policies.inviteExpirationTime * 1000 * 60)) : null,
				code: generateInviteCode(),
			}).then(x => this.registrationTicketsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.inviteCodeEntityService.pack(ticket, me);
		});
	}
}
