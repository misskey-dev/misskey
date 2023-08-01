/*
 * SPDX-FileCopyrightText: lqvp
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository } from '@/models/_.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['role'],

	requireCredential: true,
	kind: 'write:community-role',
	secure: true,

	errors: {
		notAllowed: {
			message: 'You are not allowed to add role.',
			code: 'NOT_ALLOWED_ADD_ROLE',
			id: 'e4575a43-1368-49d2-84e1-61637976c918',
		},
		emptyName: {
			message: 'Name is empty.',
			code: 'EMPTY_NAME',
			id: 'e787f7ba-a46c-46ef-a6dc-44b98e499e62',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		description: { type: 'string' },
		color: { type: 'string', nullable: true },
		iconUrl: { type: 'string', nullable: true },
		isPublic: { type: 'boolean' },
	},
	required: [
		'name',
		'description',
		'color',
		'iconUrl',
		'isPublic',
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private globalEventService: GlobalEventService,
		private idService: IdService,
		private roleEntityService: RoleEntityService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (ps.name.trim().length === 0) throw new ApiError(meta.errors.emptyName);

			const policies = await this.roleService.getUserPolicies(me ? me.id : null);
			if (!policies.canAddRoles) {
				throw new ApiError(meta.errors.notAllowed);
			}

			const date = new Date();
			const created = await this.rolesRepository.insert({
				id: this.idService.gen(),
				updatedAt: date,
				lastUsedAt: date,
				name: ps.name,
				description: ps.description,
				color: ps.color,
				iconUrl: ps.iconUrl,
				target: 'manual',
				condFormula: {},
				isPublic: ps.isPublic,
				permissionGroup: 'Community',
				isExplorable: true,
				asBadge: ps.iconUrl != null,
				canEditMembersByModerator: true,
				displayOrder: 0,
				policies: {},
				userId: me.id,
			}).then(x => this.rolesRepository.findOneByOrFail(x.identifiers[0]));

			this.globalEventService.publishInternalEvent('roleCreated', created);

			// 自動アサイン
			await this.roleService.assign(me.id, created.id, null);

			return await this.roleEntityService.pack(created, me);
		});
	}
}
