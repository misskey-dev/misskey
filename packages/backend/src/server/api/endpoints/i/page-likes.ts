import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { PageLikes } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['account', 'pages'],

	requireCredential: true as const,

	kind: 'read:page-likes',

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
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			id: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'id',
			},
			page: {
				type: 'object' as const,
				optional: false as const, nullable: false as const,
				ref: 'Page',
			},
		},
	},
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(PageLikes.createQueryBuilder('like'), ps.sinceId, ps.untilId)
		.andWhere(`like.userId = :meId`, { meId: user.id })
		.leftJoinAndSelect('like.page', 'page');

	const likes = await query
		.take(ps.limit!)
		.getMany();

	return await PageLikes.packMany(likes, user);
});
