import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import { GalleryPosts } from '@/models/index.js';
import type { GalleryLikes } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { GalleryLike } from '@/models/entities/gallery-like.js';
import { UserEntityService } from './UserEntityService.js';
import { GalleryPostEntityService } from './GalleryPostEntityService.js';

@Injectable()
export class GalleryLikeEntityService {
	constructor(
		@Inject('galleryLikesRepository')
		private galleryLikesRepository: typeof GalleryLikes,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
	}

	public async pack(
		src: GalleryLike['id'] | GalleryLike,
		me?: any,
	) {
		const like = typeof src === 'object' ? src : await this.galleryLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			post: await this.galleryPostEntityService.pack(like.post || like.postId, me),
		};
	}

	public packMany(
		likes: any[],
		me: any,
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}

