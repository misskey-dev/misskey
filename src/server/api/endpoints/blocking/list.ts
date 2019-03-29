import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { Blockings } from '../../../../models';
import { generatePaginationQuery } from '../../common/generate-pagination-query';

export const meta = {
	desc: {
		'ja-JP': 'ブロックしているユーザー一覧を取得します。',
		'en-US': 'Get blocking users.'
	},

	tags: ['blocking', 'account'],

	requireCredential: true,

	kind: 'following-read',

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
		type: 'array',
		items: {
			type: 'Blocking',
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = generatePaginationQuery(Blockings.createQueryBuilder('blocking'), ps.sinceId, ps.untilId)
		.andWhere(`blocking.blockerId = :meId`, { meId: me.id });

	const blockings = await query
		.take(ps.limit)
		.getMany();

	return await Blockings.packMany(blockings, me);
});
