import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPosts } from '@/models/index.js';
import { GalleryPostEntityService } from '@/services/entities/GalleryPostEntityService';

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
		@Inject('galleryPostsRepository')
		private galleryPostsRepository: typeof GalleryPosts,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.galleryPostsRepository.createQueryBuilder('post')
				.andWhere('post.likedCount > 0')
				.orderBy('post.likedCount', 'DESC');

			const posts = await query.take(10).getMany();

			return await this.galleryPostEntityService.packMany(posts, me);
		});
	}
}
