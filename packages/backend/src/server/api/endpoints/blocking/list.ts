import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Blockings } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'read:blocks',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30,
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
			ref: 'Blocking',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const query = makePaginationQuery(Blockings.createQueryBuilder('blocking'), ps.sinceId, ps.untilId)
		.andWhere(`blocking.blockerId = :meId`, { meId: me.id });

	const blockings = await query
		.take(ps.limit!)
		.getMany();

	return await Blockings.packMany(blockings, me);
});
