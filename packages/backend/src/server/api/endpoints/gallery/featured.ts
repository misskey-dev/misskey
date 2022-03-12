import define from '../../define.js';
import { GalleryPosts } from '@/models/index.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: false,

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

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = GalleryPosts.createQueryBuilder('post')
		.andWhere('post.createdAt > :date', { date: new Date(Date.now() - (1000 * 60 * 60 * 24 * 3)) })
		.andWhere('post.likedCount > 0')
		.orderBy('post.likedCount', 'DESC');

	const posts = await query.take(10).getMany();

	return await GalleryPosts.packMany(posts, me);
});
