/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { GalleryLikesRepository } from '@/models/_.js';
import type { } from '@/models/Blocking.js';
import type { MiGalleryLike } from '@/models/GalleryLike.js';
import { bindThis } from '@/decorators.js';
import { GalleryPostEntityService } from './GalleryPostEntityService.js';

@Injectable()
export class GalleryLikeEntityService {
	constructor(
		@Inject(DI.galleryLikesRepository)
		private galleryLikesRepository: GalleryLikesRepository,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiGalleryLike['id'] | MiGalleryLike,
		me?: any,
	) {
		const like = typeof src === 'object' ? src : await this.galleryLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			post: await this.galleryPostEntityService.pack(like.post ?? like.postId, me),
		};
	}

	@bindThis
	public packMany(
		likes: any[],
		me: any,
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}

