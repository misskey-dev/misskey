/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/_.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireAdmin: true,

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: 'cd23ef55-09ad-428a-ac61-95a45e124b32',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roleId: { type: 'string', format: 'misskey:id' },
		name: { type: 'string' },
		description: { type: 'string' },
		color: { type: 'string', nullable: true },
		iconUrl: { type: 'string', nullable: true },
		target: { type: 'string', enum: ['manual', 'conditional'] },
		condFormula: { type: 'object' },
		isPublic: { type: 'boolean' },
		isModerator: { type: 'boolean' },
		isAdministrator: { type: 'boolean' },
		isExplorable: { type: 'boolean' },
		asBadge: { type: 'boolean' },
		canEditMembersByModerator: { type: 'boolean' },
		displayOrder: { type: 'number' },
		policies: {
			type: 'object',
		},
	},
	required: [
		'roleId',
		'name',
		'description',
		'color',
		'iconUrl',
		'target',
		'condFormula',
		'isPublic',
		'isModerator',
		'isAdministrator',
		'asBadge',
		'canEditMembersByModerator',
		'displayOrder',
		'policies',
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const role = await this.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			await this.roleService.update(role, {
				name: ps.name,
				description: ps.description,
				color: ps.color,
				iconUrl: ps.iconUrl,
				target: ps.target,
				condFormula: ps.condFormula,
				isPublic: ps.isPublic,
				isModerator: ps.isModerator,
				isAdministrator: ps.isAdministrator,
				isExplorable: ps.isExplorable,
				asBadge: ps.asBadge,
				canEditMembersByModerator: ps.canEditMembersByModerator,
				displayOrder: ps.displayOrder,
				policies: ps.policies,
			}, me);
		});
	}
}
