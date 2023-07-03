import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPostsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'gallery/posts/delete'> {
	name = 'gallery/posts/delete' as const;
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,
	) {
		super(async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({
				id: ps.postId,
				userId: me.id,
			});

			if (post == null) {
				throw new ApiError(this.meta.errors.noSuchPost);
			}

			await this.galleryPostsRepository.delete(post.id);
		});
	}
}
