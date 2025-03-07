/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, GalleryPostsRepository } from '@/models/_.js';
import { MiGalleryPost } from '@/models/GalleryPost.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { IdService } from '@/core/IdService.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:gallery',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'GalleryPost',
	},

	errors: {

	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		title: { type: 'string', minLength: 1 },
		description: { type: 'string', nullable: true },
		fileIds: { type: 'array', uniqueItems: true, minItems: 1, maxItems: 32, items: {
			type: 'string', format: 'misskey:id',
		} },
		isSensitive: { type: 'boolean', default: false },
	},
	required: ['title', 'fileIds'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private galleryPostEntityService: GalleryPostEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const files = (await Promise.all(ps.fileIds.map(fileId =>
				this.driveFilesRepository.findOneBy({
					id: fileId,
					userId: me.id,
				}),
			))).filter(x => x != null);

			if (files.length === 0) {
				throw new Error();
			}

			const post = await this.galleryPostsRepository.insertOne(new MiGalleryPost({
				id: this.idService.gen(),
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				userId: me.id,
				isSensitive: ps.isSensitive,
				fileIds: files.map(file => file.id),
			}));

			return await this.galleryPostEntityService.pack(post, me);
		});
	}
}
