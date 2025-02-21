/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type {
	UsersRepository,
	UserProfilesRepository,
	MiUserProfile,
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
import { CacheService } from '@/core/CacheService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ProxyAccountService } from '@/core/ProxyAccountService.js';

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

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private roleService: RoleService,
		private userEntityService: UserEntityService,
		private cacheService: CacheService,
		private moderationLogService: ModerationLogService,
		private proxyAccountService: ProxyAccountService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const _me = await this.usersRepository.findOneByOrFail({ id: me.id });
			if (!await this.roleService.isModerator(_me)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			const proxy = await this.proxyAccountService.fetch();

			const profileUpdates = {} as Partial<MiUserProfile>;

			if (ps.description !== undefined) profileUpdates.description = ps.description;

			await this.userProfilesRepository.update(proxy.id, profileUpdates);

			const updated = await this.userEntityService.pack(proxy.id, proxy, {
				schema: 'MeDetailed',
			});
			const updatedProfile = await this.userProfilesRepository.findOneByOrFail({ userId: proxy.id });

			this.cacheService.userProfileCache.set(proxy.id, updatedProfile);

			this.moderationLogService.log(me, 'updateUser', {
				userId: proxy.id,
				userUsername: proxy.username,
				userHost: proxy.host,
			});

			return updated;
		});
	}
}
