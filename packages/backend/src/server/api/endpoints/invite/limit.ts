/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { MoreThan } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RegistrationTicketsRepository } from '@/models/index.js';
import { RoleService } from '@/core/RoleService.js';
import { DI } from '@/di-symbols.js';

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

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const policies = await this.roleService.getUserPolicies(me.id);

			const count = policies.inviteLimit ? await this.registrationTicketsRepository.countBy({
				createdAt: MoreThan(new Date(Date.now() - (policies.inviteExpirationTime * 60 * 1000))),
				createdById: me.id,
			}) : null;

			return {
				remaining: count !== null ? Math.max(0, policies.inviteLimit - count) : null,
			};
		});
	}
}
