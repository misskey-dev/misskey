import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { GalleryPosts } from '@/models/index';
import { makePaginationQuery } from '../../../common/make-pagination-query';

export const meta = {
	tags: ['users', 'gallery'],

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
	const query = makePaginationQuery(GalleryPosts.createQueryBuilder('post'), ps.sinceId, ps.untilId)
		.andWhere(`post.userId = :userId`, { userId: ps.userId });

	const posts = await query
		.take(ps.limit!)
		.getMany();

	return await GalleryPosts.packMany(posts, user);
});
