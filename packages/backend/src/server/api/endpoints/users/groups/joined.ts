import { Not, In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UserGroupsRepository, UserGroupJoiningsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserGroupEntityService } from '@/core/entities/UserGroupEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['groups', 'account'],

	requireCredential: true,

	kind: 'read:user-groups',

	description: 'List the groups that the authenticated user is a member of.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserGroup',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
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
	) {
		super(meta, paramDef, async (ps, me) => {
			const ownedGroups = await this.userGroupsRepository.findBy({
				userId: me.id,
			});

			const joinings = await this.userGroupJoiningsRepository.findBy({
				userId: me.id,
				...(ownedGroups.length > 0 ? {
					userGroupId: Not(In(ownedGroups.map(x => x.id))),
				} : {}),
			});

			return await Promise.all(joinings.map(x => this.userGroupEntityService.pack(x.userGroupId)));
		});
	}
}
