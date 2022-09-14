import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
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
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = GalleryPosts.createQueryBuilder('post')
				.andWhere('post.createdAt > :date', { date: new Date(Date.now() - (1000 * 60 * 60 * 24 * 3)) })
				.andWhere('post.likedCount > 0')
				.orderBy('post.likedCount', 'DESC');

			const posts = await query.take(10).getMany();

			return await GalleryPosts.packMany(posts, me);
		});
	}
}
