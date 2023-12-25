/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository, SigninsRepository, UserProfilesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	kind: 'read:admin',

	res: {
		type: 'object',
		nullable: false, optional: false,
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private roleService: RoleService,
		private roleEntityService: RoleEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const [user, profile] = await Promise.all([
				this.usersRepository.findOneBy({ id: ps.userId }),
				this.userProfilesRepository.findOneBy({ userId: ps.userId }),
			]);

			if (user == null || profile == null) {
				throw new Error('user not found');
			}

			const isModerator = await this.roleService.isModerator(user);
			const isSilenced = !(await this.roleService.getUserPolicies(user.id)).canPublicNote;

			const _me = await this.usersRepository.findOneByOrFail({ id: me.id });
			if (!await this.roleService.isAdministrator(_me) && await this.roleService.isAdministrator(user)) {
				throw new Error('cannot show info of admin');
			}

			const signins = await this.signinsRepository.findBy({ userId: user.id });

			const roleAssigns = await this.roleService.getUserAssigns(user.id);
			const roles = await this.roleService.getUserRoles(user.id);

			return {
				email: profile.email,
				emailVerified: profile.emailVerified,
				autoAcceptFollowed: profile.autoAcceptFollowed,
				noCrawle: profile.noCrawle,
				preventAiLearning: profile.preventAiLearning,
				alwaysMarkNsfw: profile.alwaysMarkNsfw,
				autoSensitive: profile.autoSensitive,
				carefulBot: profile.carefulBot,
				injectFeaturedNote: profile.injectFeaturedNote,
				receiveAnnouncementEmail: profile.receiveAnnouncementEmail,
				mutedWords: profile.mutedWords,
				mutedInstances: profile.mutedInstances,
				notificationRecieveConfig: profile.notificationRecieveConfig,
				isModerator: isModerator,
				isSilenced: isSilenced,
				isSuspended: user.isSuspended,
				isHibernated: user.isHibernated,
				lastActiveDate: user.lastActiveDate,
				moderationNote: profile.moderationNote ?? '',
				signins,
				policies: await this.roleService.getUserPolicies(user.id),
				roles: await this.roleEntityService.packMany(roles, me),
				roleAssigns: roleAssigns.map(a => ({
					createdAt: this.idService.parse(a.id).date.toISOString(),
					expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
					roleId: a.roleId,
				})),
			};
		});
	}
}
