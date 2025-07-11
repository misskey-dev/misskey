/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['role'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Role',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		communityOnly: {
			type: 'boolean',
		},
		communityPublicOnly: {
			type: 'boolean',
		},
		ownerOnly: {
			type: 'boolean',
		},
		assignedOnly: {
			type: 'boolean',
		},
	},
	required: [
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private roleEntityService: RoleEntityService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let roles;

			if (ps.assignedOnly) {
				const userRoles = await this.roleService.getUserRoles(me.id);
				roles = userRoles.filter(role => role.isCommunity);
			} else if (ps.communityPublicOnly) {
				roles = await this.rolesRepository.findBy({
					isCommunity: true,
					isPublic: true,
				});
			} else if (ps.communityOnly) {
				roles = await this.rolesRepository.findBy({
					isCommunity: true,
				});
			} else {
				roles = await this.rolesRepository.findBy({
					isExplorable: true,
					isPublic: true,
				});
			}

			return await this.roleEntityService.packMany(roles, me);
		});
	}
}
