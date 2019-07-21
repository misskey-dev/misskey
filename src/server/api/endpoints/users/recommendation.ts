import * as ms from 'ms';
import $ from 'cafy';
import define from '../../define';
import { Users, Followings } from '../../../../models';
import { generateMuteQueryForUsers } from '../../common/generate-mute-query';
import { generateBlockQueryForUsers } from '../../common/generate-block-query';

export const meta = {
	desc: {
		'ja-JP': 'おすすめのユーザー一覧を取得します。'
	},

	tags: ['users'],

	requireCredential: true,

	kind: 'read:account',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		}
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = Users.createQueryBuilder('user')
		.where('user.isLocked = FALSE')
		.andWhere('user.host IS NULL')
		.andWhere('user.updatedAt >= :date', { date: new Date(Date.now() - ms('7days')) })
		.andWhere('user.id != :meId', { meId: me.id })
		.orderBy('user.followersCount', 'DESC');

	generateMuteQueryForUsers(query, me);
	generateBlockQueryForUsers(query, me);

	const followingQuery = Followings.createQueryBuilder('following')
		.select('following.followeeId')
		.where('following.followerId = :followerId', { followerId: me.id });

	query
		.andWhere(`user.id NOT IN (${ followingQuery.getQuery() })`);

	query.setParameters(followingQuery.getParameters());

	const users = await query.take(ps.limit!).skip(ps.offset).getMany();

	return await Users.packMany(users, me, { detail: true });
});
