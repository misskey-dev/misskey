import define from '../../../define';
import { GalleryPosts } from '@/models/index';
import { makePaginationQuery } from '../../../common/make-pagination-query';

export const meta = {
	tags: ['users', 'gallery'],

	params: {
		type: 'object',
		properties: {
			userId: { type: 'string', format: 'misskey:id', },
			limit: { type: 'integer', maximum: 100, default: 10, },
			sinceId: { type: 'string', format: 'misskey:id', },
			untilId: { type: 'string', format: 'misskey:id', },
		},
		required: ['userId'],
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const query = makePaginationQuery(GalleryPosts.createQueryBuilder('post'), ps.sinceId, ps.untilId)
		.andWhere(`post.userId = :userId`, { userId: ps.userId });

	const posts = await query
		.take(ps.limit!)
		.getMany();

	return await GalleryPosts.packMany(posts, user);
});
