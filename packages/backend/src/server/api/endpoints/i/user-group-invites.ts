import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserGroupInvitationsRepository } from '@/models/index.js';
import { QueryService } from '@/core/QueryService.js';
import { UserGroupInvitationEntityService } from '@/core/entities/UserGroupInvitationEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account', 'groups'],

	requireCredential: true,

	kind: 'read:user-groups',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
					format: 'id',
				},
				group: {
					type: 'object',
					optional: false, nullable: false,
					ref: 'UserGroup',
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userGroupInvitationsRepository)
		private userGroupInvitationsRepository: UserGroupInvitationsRepository,

		private userGroupInvitationEntityService: UserGroupInvitationEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.userGroupInvitationsRepository.createQueryBuilder('invitation'), ps.sinceId, ps.untilId)
				.andWhere('invitation.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('invitation.userGroup', 'user_group');

			const invitations = await query
				.take(ps.limit)
				.getMany();

			return await this.userGroupInvitationEntityService.packMany(invitations);
		});
	}
}
