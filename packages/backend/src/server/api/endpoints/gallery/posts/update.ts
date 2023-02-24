import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, GalleryPostsRepository } from '@/models/index.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['gallery'],

	requireCredential: true,

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
	required: ['postId', 'title', 'fileIds'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private galleryPostEntityService: GalleryPostEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const files = (await Promise.all(ps.fileIds.map(fileId =>
				this.driveFilesRepository.findOneBy({
					id: fileId,
					userId: me.id,
				}),
			))).filter((file): file is DriveFile => file != null);

			if (files.length === 0) {
				throw new Error();
			}

			await this.galleryPostsRepository.update({
				id: ps.postId,
				userId: me.id,
			}, {
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				isSensitive: ps.isSensitive,
				fileIds: files.map(file => file.id),
			});

			const post = await this.galleryPostsRepository.findOneByOrFail({ id: ps.postId });

			return await this.galleryPostEntityService.pack(post, me);
		});
	}
}
