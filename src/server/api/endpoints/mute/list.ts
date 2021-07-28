import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { Mutings } from '../../../../models';

export const meta = {
	tags: ['account'],

	requireCredential: true as const,

	kind: 'read:mutes',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30
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
			ref: 'Muting',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(Mutings.createQueryBuilder('muting'), ps.sinceId, ps.untilId)
		.andWhere(`muting.muterId = :meId`, { meId: me.id });

	const mutings = await query
		.take(ps.limit!)
		.getMany();

	return await Mutings.packMany(mutings, me);
});
