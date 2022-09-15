import { Inject, Injectable } from '@nestjs/common';
import type { UserGroups, UserGroupJoinings } from '@/models/index.js';
import { IdService } from '@/services/IdService.js';
import type { UserGroup } from '@/models/entities/user-group.js';
import type { UserGroupJoining } from '@/models/entities/user-group-joining.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserGroupEntityService } from '@/services/entities/UserGroupEntityService.js';

export const meta = {
	tags: ['groups'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Create a new group.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserGroup',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('userGroupsRepository')
		private userGroupsRepository: typeof UserGroups,

		@Inject('userGroupJoiningsRepository')
		private userGroupJoiningsRepository: typeof UserGroupJoinings,

		private userGroupEntityService: UserGroupEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const userGroup = await this.userGroupsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				name: ps.name,
			} as UserGroup).then(x => this.userGroupsRepository.findOneByOrFail(x.identifiers[0]));

			// Push the owner
			await this.userGroupJoiningsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				userGroupId: userGroup.id,
			} as UserGroupJoining);

			return await this.userGroupEntityService.pack(userGroup);
		});
	}
}
