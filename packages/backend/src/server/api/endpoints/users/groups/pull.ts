import { Inject, Injectable } from '@nestjs/common';
import type { UserGroupsRepository, UserGroupJoiningsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GetterService } from '@/server/api/GetterService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Removes a specified user from a group. The owner can not be removed.',

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '4662487c-05b1-4b78-86e5-fd46998aba74',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '0b5cc374-3681-41da-861e-8bc1146f7a55',
		},

		isOwner: {
			message: 'The user is the owner.',
			code: 'IS_OWNER',
			id: '1546eed5-4414-4dea-81c1-b0aec4f6d2af',
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

		@Inject(DI.userGroupJoiningsRepository)
		private userGroupJoiningsRepository: UserGroupJoiningsRepository,

		private getterService: GetterService,
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

			if (user.id === userGroup.userId) {
				throw new ApiError(meta.errors.isOwner);
			}

			// Pull the user
			await this.userGroupJoiningsRepository.delete({ userGroupId: userGroup.id, userId: user.id });
		});
	}
}
