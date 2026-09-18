/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPostsRepository } from '@/models/_.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { packedGalleryPostSchema } from '@/models/schema/gallery-post.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: false,

	res: v.array(packedGalleryPostSchema),
} as const;

export const paramDef = v.object({
	limit: mi.limit({ max: 100, def: 10 }),
	untilId: v.optional(mi.misskeyId()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	private galleryPostsRankingCache: string[] = [];
	private galleryPostsRankingCacheLastFetchedAt = 0;

	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		private galleryPostEntityService: GalleryPostEntityService,
		private featuredService: FeaturedService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let postIds: string[];
			if (this.galleryPostsRankingCacheLastFetchedAt !== 0 && (Date.now() - this.galleryPostsRankingCacheLastFetchedAt < 1000 * 60 * 30)) {
				postIds = this.galleryPostsRankingCache;
			} else {
				postIds = await this.featuredService.getGalleryPostsRanking(100);
				this.galleryPostsRankingCache = postIds;
				this.galleryPostsRankingCacheLastFetchedAt = Date.now();
			}

			postIds.sort((a, b) => a > b ? -1 : 1);
			if (ps.untilId) {
				postIds = postIds.filter(id => id < ps.untilId!);
			}
			postIds = postIds.slice(0, ps.limit);

			if (postIds.length === 0) {
				return [];
			}

			const query = this.galleryPostsRepository.createQueryBuilder('post')
				.where('post.id IN (:...postIds)', { postIds: postIds });

			const posts = await query.getMany();

			return await this.galleryPostEntityService.packMany(posts, me);
		});
	}
}
