import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPostsRepository, GalleryLikesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'gallery/posts/unlike'> {
	name = 'gallery/posts/unlike' as const;
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.galleryLikesRepository)
		private galleryLikesRepository: GalleryLikesRepository,
	) {
		super(async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: ps.postId });
			if (post == null) {
				throw new ApiError(this.meta.errors.noSuchPost);
			}

			const exist = await this.galleryLikesRepository.findOneBy({
				postId: post.id,
				userId: me.id,
			});

			if (exist == null) {
				throw new ApiError(this.meta.errors.notLiked);
			}

			// Delete like
			await this.galleryLikesRepository.delete(exist.id);

			this.galleryPostsRepository.decrement({ id: post.id }, 'likedCount', 1);
		});
	}
}
