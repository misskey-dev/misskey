import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { UserGroupInvitations } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['account', 'groups'],

	requireCredential: true,

	kind: 'read:user-groups',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},
	},

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

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(UserGroupInvitations.createQueryBuilder('invitation'), ps.sinceId, ps.untilId)
		.andWhere(`invitation.userId = :meId`, { meId: user.id })
		.leftJoinAndSelect('invitation.userGroup', 'user_group');

	const invitations = await query
		.take(ps.limit!)
		.getMany();

	return await UserGroupInvitations.packMany(invitations);
});
