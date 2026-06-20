/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, GalleryPostsRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:gallery',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'GalleryPost',
	},

	errors: {
		noSuchPost: {
			message: 'No such post.',
			code: 'NO_SUCH_POST',
			id: '0b95e661-4216-45c9-a65b-7a1fdb879e47',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: 'b4fb0c3d-7b51-4073-8820-5cd8b49bc08f',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		postId: { type: 'string', format: 'misskey:id' },
		title: { type: 'string', minLength: 1 },
		description: { type: 'string', nullable: true },
		fileIds: { type: 'array', uniqueItems: true, minItems: 1, maxItems: 32, items: {
			type: 'string', format: 'misskey:id',
		} },
		isSensitive: { type: 'boolean', default: false },
	},
	required: ['postId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const post = await this.galleryPostsRepository.findOneBy({ id: ps.postId });

			if (post == null) {
				throw new ApiError(meta.errors.noSuchPost);
			}

			if (post.userId !== me.id) {
				throw new ApiError(meta.errors.accessDenied);
			}

			let files: Array<MiDriveFile> | undefined;

			if (ps.fileIds) {
				files = (await Promise.all(ps.fileIds.map(fileId =>
					this.driveFilesRepository.findOneBy({
						id: fileId,
						userId: me.id,
					}),
				))).filter(x => x != null);

				if (files.length === 0) {
					throw new Error();
				}
			}

			await this.galleryPostsRepository.update(post.id, {
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				isSensitive: ps.isSensitive,
				fileIds: files ? files.map(file => file.id) : undefined,
			});

			const updatedPost = await this.galleryPostsRepository.findOneByOrFail({ id: post.id });

			return await this.galleryPostEntityService.pack(updatedPost, me);
		});
	}
}
