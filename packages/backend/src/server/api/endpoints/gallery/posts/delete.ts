/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { GalleryPostsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
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
	) {
		super(meta, paramDef, async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({
				id: ps.postId,
				userId: me.id,
			});

			if (post == null) {
				throw new ApiError(meta.errors.noSuchPost);
			}

			await this.galleryPostsRepository.delete(post.id);
		});
	}
}
