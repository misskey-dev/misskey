import define from '../../define';
import { makePaginationQuery } from '../../common/make-pagination-query';
import { GalleryPosts } from '@/models/index';

export const meta = {
	tags: ['gallery'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'GalleryPost',
		},
	},
} as const;

const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = makePaginationQuery(GalleryPosts.createQueryBuilder('post'), ps.sinceId, ps.untilId)
		.innerJoinAndSelect('post.user', 'user');

	const posts = await query.take(ps.limit).getMany();

	return await GalleryPosts.packMany(posts, me);
});
