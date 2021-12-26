import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { Clips } from '@/models/index';
import { makePaginationQuery } from '../../common/make-pagination-query';

export const meta = {
	tags: ['users', 'clips'],

	params: {
		userId: {
			validator: $.type(ID),
		},

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
	const query = makePaginationQuery(Clips.createQueryBuilder('clip'), ps.sinceId, ps.untilId)
		.andWhere(`clip.userId = :userId`, { userId: ps.userId })
		.andWhere('clip.isPublic = true');

	const clips = await query
		.take(ps.limit!)
		.getMany();

	return await Clips.packMany(clips);
});
