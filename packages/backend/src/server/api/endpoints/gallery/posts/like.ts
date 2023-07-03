import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryLikesRepository, GalleryPostsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'gallery/posts/like'> {
	name = 'gallery/posts/like' as const;
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.galleryLikesRepository)
		private galleryLikesRepository: GalleryLikesRepository,

		private idService: IdService,
	) {
		super(async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: ps.postId });
			if (post == null) {
				throw new ApiError(this.meta.errors.noSuchPost);
			}

			if (post.userId === me.id) {
				throw new ApiError(this.meta.errors.yourPost);
			}

			// if already liked
			const exist = await this.galleryLikesRepository.findOneBy({
				postId: post.id,
				userId: me.id,
			});

			if (exist != null) {
				throw new ApiError(this.meta.errors.alreadyLiked);
			}

			// Create like
			await this.galleryLikesRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				postId: post.id,
				userId: me.id,
			});

			this.galleryPostsRepository.increment({ id: post.id }, 'likedCount', 1);
		});
	}
}
