import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Users } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['federation'],

	requireCredential: false as const,

	params: {
		host: {
			validator: $.str,
		},

		sinceId: {
			validator: $.optional.type(ID),
		},

		untilId: {
			validator: $.optional.type(ID),
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User',
		},
	},
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(Users.createQueryBuilder('user'), ps.sinceId, ps.untilId)
		.andWhere(`user.host = :host`, { host: ps.host });

	const users = await query
		.take(ps.limit!)
		.getMany();

	return await Users.packMany(users, me, { detail: true });
});
