/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type {
	UsersRepository,
} from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import {
	descriptionSchema,
	nameSchema,
} from '@/models/User.js';
import { ApiError } from '@/server/api/error.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { SystemAccountService } from '@/core/SystemAccountService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:update-proxy-account',

	errors: {
		accessDenied: {
			message: 'Only administrators can edit members of the role.',
			code: 'ACCESS_DENIED',
			id: '101f9105-27cb-489c-842a-69b6d2092c03',
		},
	},

	res: {
		type: 'object',
		nullable: false, optional: false,
		ref: 'UserDetailed',
	},

	required: [],
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { ...nameSchema, nullable: true },
		description: { ...descriptionSchema, nullable: true },
		avatarId: { type: 'string', format: 'misskey:id', nullable: true },
		bannerId: { type: 'string', format: 'misskey:id', nullable: true },
	},
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private roleService: RoleService,
		private userEntityService: UserEntityService,
		private moderationLogService: ModerationLogService,
		private systemAccountService: SystemAccountService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const _me = await this.usersRepository.findOneByOrFail({ id: me.id });
			if (!await this.roleService.isModerator(_me)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			const proxy = await this.systemAccountService.updateCorrespondingUserProfile('proxy', {
				description: ps.description,
			});

			const updated = await this.userEntityService.pack(proxy.id, proxy, {
				schema: 'MeDetailed',
			});

			this.moderationLogService.log(me, 'updateUser', {
				userId: proxy.id,
				userUsername: proxy.username,
				userHost: proxy.host,
			});

			return updated;
		});
	}
}
