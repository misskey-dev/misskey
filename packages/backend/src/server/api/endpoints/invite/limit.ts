/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import type { IdService } from '@/core/IdService.js';
import type { RoleService } from '@/core/RoleService.js';
import { DI } from '@/di-symbols.js';
import type { RegistrationTicketsRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requiredRolePolicy: 'canInvite',
	kind: 'read:invite-codes',

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

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.registrationTicketsRepository)
		private registrationTicketsRepository: RegistrationTicketsRepository,

		private roleService: RoleService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);

			const count = policies.inviteLimit ? await this.registrationTicketsRepository.countBy({
				id: MoreThan(this.idService.gen(Date.now() - (policies.inviteLimitCycle * 60 * 1000))),
				createdById: me.id,
			}) : null;

			return {
				remaining: count !== null ? Math.max(0, policies.inviteLimit - count) : null,
			};
		});
	}
}
