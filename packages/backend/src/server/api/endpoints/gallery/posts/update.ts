/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, GalleryPostsRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';
import { packedGalleryPostSchema } from '@/models/schema/gallery-post.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:gallery',

	limit: {
		duration: ms('1hour'),
		max: 300,
	},

	res: packedGalleryPostSchema,

	errors: {

	},
} as const;

export const paramDef = v.object({
	postId: mi.misskeyId(),
	title: v.optional(v.pipe(v.string(), mi.minCodePoints(1))),
	description: v.optional(v.nullable(v.string())),
	fileIds: v.optional(v.pipe(v.array(mi.misskeyId()), mi.uniqueArray(), v.minLength(1), v.maxLength(32))),
	isSensitive: v.optional(v.boolean(), false),
});

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

			await this.galleryPostsRepository.update({
				id: ps.postId,
				userId: me.id,
			}, {
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				isSensitive: ps.isSensitive,
				fileIds: files ? files.map(file => file.id) : undefined,
			});

			const post = await this.galleryPostsRepository.findOneByOrFail({ id: ps.postId });

			return await this.galleryPostEntityService.pack(post, me);
		});
	}
}
