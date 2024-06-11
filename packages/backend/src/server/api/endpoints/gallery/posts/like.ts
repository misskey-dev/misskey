/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryLikesRepository, GalleryPostsRepository } from '@/models/_.js';
import { FeaturedService, GALLERY_POSTS_RANKING_WINDOW } from '@/core/FeaturedService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:gallery-likes',

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: '56c06af3-1287-442f-9701-c93f7c4a62ff',
		},

		yourPost: {
			message: 'You cannot like your post.',
			code: 'YOUR_POST',
			id: 'f78f1511-5ebc-4478-a888-1198d752da68',
		},

		alreadyLiked: {
			message: 'The post has already been liked.',
			code: 'ALREADY_LIKED',
			id: '40e9ed56-a59c-473a-bf3f-f289c54fb5a7',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
	},
	required: ['postId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.galleryLikesRepository)
		private galleryLikesRepository: GalleryLikesRepository,

		private featuredService: FeaturedService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: ps.postId });
			if (post == null) {
				throw new ApiError(meta.errors.noSuchPost);
			}

			if (post.userId === me.id) {
				throw new ApiError(meta.errors.yourPost);
			}

			// if already liked
			const exist = await this.galleryLikesRepository.exists({
				where: {
					postId: post.id,
					userId: me.id,
				},
			});

			if (exist) {
				throw new ApiError(meta.errors.alreadyLiked);
			}

			// Create like
			await this.galleryLikesRepository.insert({
				id: this.idService.gen(),
				postId: post.id,
				userId: me.id,
			});

			// ランキング更新
			if (Date.now() - this.idService.parse(post.id).date.getTime() < GALLERY_POSTS_RANKING_WINDOW) {
				await this.featuredService.updateGalleryPostsRanking(post.id, 1);
			}

			this.galleryPostsRepository.increment({ id: post.id }, 'likedCount', 1);
		});
	}
}
