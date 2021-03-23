import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Pages } from '../../../../models';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['users', 'pages'],

	params: {
		userId: {
			validator: $.type(ID),
		},

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
	const query = makePaginationQuery(Pages.createQueryBuilder('page'), ps.sinceId, ps.untilId)
		.andWhere(`page.userId = :userId`, { userId: ps.userId })
		.andWhere('page.visibility = \'public\'');

	const pages = await query
		.take(ps.limit!)
		.getMany();

	return await Pages.packMany(pages);
});
