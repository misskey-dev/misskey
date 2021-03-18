import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { UserGroupInvitations } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	desc: {
		'ja-JP': 'グループへの招待一覧を取得します。',
		'en-US': 'Get user group invitations.'
	},

	tags: ['account', 'groups'],

	requireCredential: true as const,

	kind: 'read:user-groups',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			properties: {
				id: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
					format: 'id'
				},
				group: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					ref: 'UserGroup'
				}
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(UserGroupInvitations.createQueryBuilder('invitation'), ps.sinceId, ps.untilId)
		.andWhere(`invitation.userId = :meId`, { meId: user.id })
		.leftJoinAndSelect('invitation.userGroup', 'user_group');

	const invitations = await query
		.take(ps.limit!)
		.getMany();

	return await UserGroupInvitations.packMany(invitations);
});
