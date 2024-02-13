/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { RolesRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { RoleService } from '@/core/RoleService.js';

export const meta = {
	tags: ['admin', 'role'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:roles',

	errors: {
		noSuchRole: {
			message: 'No such role.',
			code: 'NO_SUCH_ROLE',
			id: '6503c040-6af4-4ed9-bf07-f2dd16678eab',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '558ea170-f653-4700-94d0-5a818371d0df',
		},

		accessDenied: {
			message: 'Only administrators can edit members of the role.',
			code: 'ACCESS_DENIED',
			id: '25b5bc31-dc79-4ebd-9bd2-c84978fd052c',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		roleId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
		expiresAt: {
			type: 'integer',
			nullable: true,
		},
	},
	required: [
		'roleId',
		'userId',
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.rolesRepository)
		private rolesRepository: RolesRepository,

		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const role = await this.rolesRepository.findOneBy({ id: ps.roleId });
			if (role == null) {
				throw new ApiError(meta.errors.noSuchRole);
			}

			if (!role.canEditMembersByModerator && !(await this.roleService.isAdministrator(me))) {
				throw new ApiError(meta.errors.accessDenied);
			}

			const user = await this.usersRepository.findOneBy({ id: ps.userId });
			if (user == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			if (ps.expiresAt && ps.expiresAt <= Date.now()) {
				return;
			}

			await this.roleService.assign(user.id, role.id, ps.expiresAt ? new Date(ps.expiresAt) : null, me);
		});
	}
}
