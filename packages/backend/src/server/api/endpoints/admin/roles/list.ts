/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { packedRoleSchema } from '@/models/schema/role.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:roles',

	res: v.array(packedRoleSchema),
} as const;

export const paramDef = v.object({});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private roleEntityService: RoleEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const roles = await this.rolesRepository.find({
				order: { lastUsedAt: 'DESC' },
			});
			return await this.roleEntityService.packMany(roles, me);
		});
	}
}
