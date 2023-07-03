import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPostsRepository } from '@/models/index.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'gallery/featured'> {
	name = 'gallery/featured' as const;
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
		super(async (ps, me) => {
			const query = this.galleryPostsRepository.createQueryBuilder('post')
				.andWhere('post.createdAt > :date', { date: new Date(Date.now() - (1000 * 60 * 60 * 24 * 3)) })
				.andWhere('post.likedCount > 0')
				.orderBy('post.likedCount', 'DESC');

			const posts = await query.take(10).getMany();

			return await this.galleryPostEntityService.packMany(posts, me);
		});
	}
}
