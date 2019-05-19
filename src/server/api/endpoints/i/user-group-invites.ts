import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { UserGroupInvites } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	desc: {
		'ja-JP': 'グループへの招待一覧を取得します。',
		'en-US': 'Get user group invitations.'
	},

	tags: ['account', 'groups'],

	requireCredential: true,

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
	}
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(UserGroupInvites.createQueryBuilder('invite'), ps.sinceId, ps.untilId)
		.andWhere(`invite.userId = :meId`, { meId: user.id })
		.leftJoinAndSelect('invite.userGroup', 'user_group');

	const invites = await query
		.take(ps.limit!)
		.getMany();

	return await UserGroupInvites.packMany(invites);
});
