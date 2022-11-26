import { Inject, Injectable } from '@nestjs/common';
import type { UserGroupsRepository, UserGroupJoiningsRepository, UserGroupInvitationsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import type { UserGroupInvitation } from '@/models/entities/UserGroupInvitation.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Invite a user to an existing group.',

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '583f8bc0-8eee-4b78-9299-1e14fc91e409',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'da52de61-002c-475b-90e1-ba64f9cf13a8',
		},

		alreadyAdded: {
			message: 'That user has already been added to that group.',
			code: 'ALREADY_ADDED',
			id: '7e35c6a0-39b2-4488-aea6-6ee20bd5da2c',
		},

		alreadyInvited: {
			message: 'That user has already been invited to that group.',
			code: 'ALREADY_INVITED',
			id: 'ee0f58b4-b529-4d13-b761-b9a3e69f97e6',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		groupId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['groupId', 'userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userGroupsRepository)
		private userGroupsRepository: UserGroupsRepository,

		@Inject(DI.userGroupInvitationsRepository)
		private userGroupInvitationsRepository: UserGroupInvitationsRepository,

		@Inject(DI.userGroupJoiningsRepository)
		private userGroupJoiningsRepository: UserGroupJoiningsRepository,

		private idService: IdService,
		private getterService: GetterService,
		private createNotificationService: CreateNotificationService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Fetch the group
			const userGroup = await this.userGroupsRepository.findOneBy({
				id: ps.groupId,
				userId: me.id,
			});

			if (userGroup == null) {
				throw new ApiError(meta.errors.noSuchGroup);
			}

			// Fetch the user
			const user = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			const joining = await this.userGroupJoiningsRepository.findOneBy({
				userGroupId: userGroup.id,
				userId: user.id,
			});

			if (joining) {
				throw new ApiError(meta.errors.alreadyAdded);
			}

			const existInvitation = await this.userGroupInvitationsRepository.findOneBy({
				userGroupId: userGroup.id,
				userId: user.id,
			});

			if (existInvitation) {
				throw new ApiError(meta.errors.alreadyInvited);
			}

			const invitation = await this.userGroupInvitationsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: user.id,
				userGroupId: userGroup.id,
			} as UserGroupInvitation).then(x => this.userGroupInvitationsRepository.findOneByOrFail(x.identifiers[0]));

			// 通知を作成
			this.createNotificationService.createNotification(user.id, 'groupInvited', {
				notifierId: me.id,
				userGroupInvitationId: invitation.id,
			});
		});
	}
}
