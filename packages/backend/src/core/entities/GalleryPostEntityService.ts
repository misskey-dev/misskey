/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { GalleryLikesRepository, GalleryPostsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/json-schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { GalleryPost } from '@/models/entities/GalleryPost.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class GalleryPostEntityService {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.galleryLikesRepository)
		private galleryLikesRepository: GalleryLikesRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: GalleryPost['id'] | GalleryPost,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'GalleryPost'>> {
		const meId = me ? me.id : null;
		const post = typeof src === 'object' ? src : await this.galleryPostsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: post.id,
			createdAt: post.createdAt.toISOString(),
			updatedAt: post.updatedAt.toISOString(),
			userId: post.userId,
			user: this.userEntityService.pack(post.user ?? post.userId, me),
			title: post.title,
			description: post.description,
			fileIds: post.fileIds,
			// TODO: packMany causes N+1 queries
			files: this.driveFileEntityService.packManyByIds(post.fileIds),
			tags: post.tags.length > 0 ? post.tags : undefined,
			isSensitive: post.isSensitive,
			likedCount: post.likedCount,
			isLiked: meId ? await this.galleryLikesRepository.exist({ where: { postId: post.id, userId: meId } }) : undefined,
		});
	}

	@bindThis
	public packMany(
		posts: GalleryPost[],
		me?: { id: User['id'] } | null | undefined,
	) {
		return Promise.all(posts.map(x => this.pack(x, me)));
	}
}

