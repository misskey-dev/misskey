import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Signins } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	requireCredential: true as const,

	secure: true,

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
};

export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(Signins.createQueryBuilder('signin'), ps.sinceId, ps.untilId)
		.andWhere(`signin.userId = :meId`, { meId: user.id });

	const history = await query.take(ps.limit!).getMany();

	return await Promise.all(history.map(record => Signins.pack(record)));
});
