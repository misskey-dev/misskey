/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPostsRepository } from '@/models/_.js';
import { QueryService } from '@/core/QueryService.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedGalleryPostSchema } from '@/models/schema/gallery-post.js';

export const meta = {
	tags: ['account', 'gallery'],

	requireCredential: true,

	kind: 'read:gallery',

	res: v.array(packedGalleryPostSchema),
} as const;

export const paramDef = v.object({
	...mi.paginationEntries({ max: 100, default: 10 }),
	...mi.paginationDateEntries(),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		private galleryPostEntityService: GalleryPostEntityService,
		private queryService: QueryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.queryService.makePaginationQuery(this.galleryPostsRepository.createQueryBuilder('post'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('post.userId = :meId', { meId: me.id });

			const posts = await query
				.limit(ps.limit)
				.getMany();

			return await this.galleryPostEntityService.packMany(posts, me);
		});
	}
}
