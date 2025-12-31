/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPostsRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	kind: 'write:gallery',

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: 'ae52f367-4bd7-4ecd-afc6-5672fff427f5',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'c86e09de-1c48-43ac-a435-1c7e42ed4496',
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

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private moderationLogService: ModerationLogService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: ps.postId });

			if (post == null) {
				throw new ApiError(meta.errors.noSuchPost);
			}

			if (!await this.roleService.isModerator(me) && post.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			await this.galleryPostsRepository.delete(post.id);

			if (post.userId !== me.id) {
				const user = await this.usersRepository.findOneByOrFail({ id: post.userId });
				this.moderationLogService.log(me, 'deleteGalleryPost', {
					postId: post.id,
					postUserId: post.userId,
					postUserUsername: user.username,
					post,
				});
			}
		});
	}
}
