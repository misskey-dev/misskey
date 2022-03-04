import define from '../../define.js';
import { UserGroupInvitations } from '@/models/index.js';
import { makePaginationQuery } from '../../common/make-pagination-query.js';

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
export default define(meta, paramDef, async (ps, user) => {
	const query = makePaginationQuery(UserGroupInvitations.createQueryBuilder('invitation'), ps.sinceId, ps.untilId)
		.andWhere(`invitation.userId = :meId`, { meId: user.id })
		.leftJoinAndSelect('invitation.userGroup', 'user_group');

	const invitations = await query
		.take(ps.limit)
		.getMany();

	return await UserGroupInvitations.packMany(invitations);
});
