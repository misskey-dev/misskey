/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { GalleryLikesRepository } from '@/models/index.js';
import type { GalleryLike } from '@/models/entities/GalleryLike.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import type { User } from '@/models/entities/User.js';
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
		src: GalleryLike['id'] | GalleryLike,
		me: { id: User['id'] } | null | undefined,
	) : Promise<Packed<'GalleryLike'>> {
		const like = typeof src === 'object' ? src : await this.galleryLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			post: await this.galleryPostEntityService.pack(like.post ?? like.postId, me),
		};
	}

	@bindThis
	public async packMany(
		likes: (GalleryLike['id'] | GalleryLike)[],
		me: { id: User['id'] } | null | undefined,
	) : Promise<Packed<'GalleryLike'>[]> {
		return (await Promise.allSettled(likes.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'GalleryLike'>>).value);
	}
}

