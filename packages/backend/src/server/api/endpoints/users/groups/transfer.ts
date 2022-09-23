import { Inject, Injectable } from '@nestjs/common';
import type { UserGroupsRepository, UserGroupJoiningsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserGroupEntityService } from '@/core/entities/UserGroupEntityService.js';
import { GetterService } from '@/server/api/GetterService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Transfer ownership of a group from the authenticated user to another user.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserGroup',
	},

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '8e31d36b-2f88-4ccd-a438-e2d78a9162db',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '711f7ebb-bbb9-4dfa-b540-b27809fed5e9',
		},

		noSuchGroupMember: {
			message: 'No such group member.',
			code: 'NO_SUCH_GROUP_MEMBER',
			id: 'd31bebee-196d-42c2-9a3e-9474d4be6cc4',
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

		private userGroupEntityService: UserGroupEntityService,
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

			const joining = await this.userGroupJoiningsRepository.findOneBy({
				userGroupId: userGroup.id,
				userId: user.id,
			});

			if (joining == null) {
				throw new ApiError(meta.errors.noSuchGroupMember);
			}

			await this.userGroupsRepository.update(userGroup.id, {
				userId: ps.userId,
			});

			return await this.userGroupEntityService.pack(userGroup.id);
		});
	}
}
