import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { Followings } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		host: {
			validator: $.str
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Following',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(Followings.createQueryBuilder('following'), ps.sinceId, ps.untilId)
		.andWhere(`following.followerHost = :host`, { host: ps.host });

	const followings = await query
		.take(ps.limit!)
		.getMany();

	return await Followings.packMany(followings, me, { populateFollowee: true });
});
