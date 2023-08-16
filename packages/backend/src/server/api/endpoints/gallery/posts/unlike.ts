/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPostsRepository, GalleryLikesRepository } from '@/models/index.js';
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
			id: 'c32e6dd0-b555-4413-925e-b3757d19ed84',
		},

		notLiked: {
			message: 'You have not liked that post.',
			code: 'NOT_LIKED',
			id: 'e3e8e06e-be37-41f7-a5b4-87a8250288f0',
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

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.galleryLikesRepository)
		private galleryLikesRepository: GalleryLikesRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: ps.postId });
			if (post == null) {
				throw new ApiError(meta.errors.noSuchPost);
			}

			const exist = await this.galleryLikesRepository.findOneBy({
				postId: post.id,
				userId: me.id,
			});

			if (exist == null) {
				throw new ApiError(meta.errors.notLiked);
			}

			// Delete like
			await this.galleryLikesRepository.delete(exist.id);

			this.galleryPostsRepository.decrement({ id: post.id }, 'likedCount', 1);
		});
	}
}
