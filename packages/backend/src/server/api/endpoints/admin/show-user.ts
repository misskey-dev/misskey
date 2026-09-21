/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import type { UsersRepository, SigninsRepository, UserProfilesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { RoleEntityService } from '@/core/entities/RoleEntityService.js';
import { IdService } from '@/core/IdService.js';
import { notificationRecieveConfigSchema } from '@/models/schema/user.js';
import { packedSigninSchema } from '@/models/schema/signin.js';
import { packedRoleSchema, packedRolePoliciesSchema } from '@/models/schema/role.js';
import type { PackedSignin } from '@/models/schema/signin.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:show-user',

	res: v.object({
		email: v.nullable(v.string()),
		emailVerified: v.boolean(),
		followedMessage: v.nullable(v.string()),
		autoAcceptFollowed: v.boolean(),
		noCrawle: v.boolean(),
		preventAiLearning: v.boolean(),
		alwaysMarkNsfw: v.boolean(),
		autoSensitive: v.boolean(),
		carefulBot: v.boolean(),
		injectFeaturedNote: v.boolean(),
		receiveAnnouncementEmail: v.boolean(),
		// NOTE: legacy の items は `type` を持たない `anyOf` なので素の v.union (= anyOf 出力)
		mutedWords: v.array(v.union([v.string(), v.array(v.string())])),
		mutedInstances: v.array(v.string()),
		notificationRecieveConfig: v.object({
			note: v.optional(notificationRecieveConfigSchema),
			follow: v.optional(notificationRecieveConfigSchema),
			mention: v.optional(notificationRecieveConfigSchema),
			reply: v.optional(notificationRecieveConfigSchema),
			renote: v.optional(notificationRecieveConfigSchema),
			quote: v.optional(notificationRecieveConfigSchema),
			reaction: v.optional(notificationRecieveConfigSchema),
			pollEnded: v.optional(notificationRecieveConfigSchema),
			scheduledNotePosted: v.optional(notificationRecieveConfigSchema),
			scheduledNotePostFailed: v.optional(notificationRecieveConfigSchema),
			receiveFollowRequest: v.optional(notificationRecieveConfigSchema),
			followRequestAccepted: v.optional(notificationRecieveConfigSchema),
			roleAssigned: v.optional(notificationRecieveConfigSchema),
			chatRoomInvitationReceived: v.optional(notificationRecieveConfigSchema),
			achievementEarned: v.optional(notificationRecieveConfigSchema),
			app: v.optional(notificationRecieveConfigSchema),
			test: v.optional(notificationRecieveConfigSchema),
		}),
		isModerator: v.boolean(),
		isSilenced: v.boolean(),
		isSuspended: v.boolean(),
		isHibernated: v.boolean(),
		lastActiveDate: v.nullable(v.string()),
		moderationNote: v.string(),
		signins: v.array(packedSigninSchema),
		policies: packedRolePoliciesSchema,
		roles: v.array(packedRoleSchema),
		roleAssigns: v.array(v.object({
			createdAt: v.string(),
			expiresAt: v.nullable(v.string()),
			roleId: v.string(),
		})),
	}),
} as const;

export const paramDef = v.object({
	userId: mi.misskeyId(),
});

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
				followedMessage: profile.followedMessage,
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
				lastActiveDate: user.lastActiveDate ? user.lastActiveDate.toISOString() : null,
				moderationNote: profile.moderationNote ?? '',
				// NOTE: legacy の res は `items: { ref: 'Signin' }` (type キー無し) だったため
				// SchemaType が any に潰れており、MiSignin をそのまま返す実装が型検査を通っていた。
				// ランタイム挙動を変えないため (現行レスポンスは MiSignin の生の形) キャストで維持する。
				signins: signins as unknown as PackedSignin[],
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
