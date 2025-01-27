/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { AvatarDecorationService } from '@/core/AvatarDecorationService.js';
import { IdService } from '@/core/IdService.js';
import { ApiError } from '../../../error.js';
import { DI } from '@/di-symbols.js';
import type { UsersRepository } from '@/models/_.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireRolePolicy: 'canManageAvatarDecorations',
	kind: 'write:admin:avatar-decorations',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			createdAt: {
				type: 'string',
				optional: false, nullable: false,
				format: 'date-time',
			},
			updatedAt: {
				type: 'string',
				optional: false, nullable: true,
				format: 'date-time',
			},
			name: {
				type: 'string',
				optional: false, nullable: false,
			},
			description: {
				type: 'string',
				optional: false, nullable: false,
			},
			url: {
				type: 'string',
				optional: false, nullable: false,
			},
			roleIdsThatCanBeUsedThisDecoration: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
			},
		},
	},
	errors: {
                duplicateName: {
                        message: 'Duplicate name.',
                        code: 'DUPLICATE_NAME',
                        id: 'f7a3462c-4e6e-4069-8421-b9bd4f4c3975',
                },
	},

} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1 },
		description: { type: 'string' },
		url: { type: 'string', minLength: 1 },
		roleIdsThatCanBeUsedThisDecoration: { type: 'array', items: {
			type: 'string',
		} },
	},
	required: ['name', 'description', 'url'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		private avatarDecorationService: AvatarDecorationService,
		private idService: IdService,
		private roleService: RoleService,

	) {
		super(meta, paramDef, async (ps, me) => {
			const isDuplicate = await this.avatarDecorationService.checkDuplicate(ps.name);
			if (isDuplicate) throw new ApiError(meta.errors.duplicateName);

			let pure_description = ps.description;
			ps.description = me.id + "# " + ps.description;
			const created = await this.avatarDecorationService.create({
				name: ps.name,
				description: ps.description,
				url: ps.url,
				roleIdsThatCanBeUsedThisDecoration: ps.roleIdsThatCanBeUsedThisDecoration,
			}, me);

			const _me = await this.usersRepository.findOneByOrFail({ id: me.id });
			const isAdmin = await this.roleService.isAdministrator(_me);
			if ( isAdmin ){
				pure_description = created.description;
			}

			return {
				id: created.id,
				createdAt: this.idService.parse(created.id).date.toISOString(),
				updatedAt: null,
				name: created.name,
				description: pure_description,
				url: created.url,
				roleIdsThatCanBeUsedThisDecoration: created.roleIdsThatCanBeUsedThisDecoration,
			};
		});
	}
}
