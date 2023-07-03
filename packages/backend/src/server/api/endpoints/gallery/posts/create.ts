import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository, GalleryPostsRepository } from '@/models/index.js';
import { GalleryPost } from '@/models/entities/GalleryPost.js';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import { IdService } from '@/core/IdService.js';
import { GalleryPostEntityService } from '@/core/entities/GalleryPostEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'gallery/posts/create'> {
	name = 'gallery/posts/create' as const;
	constructor(
		@Inject(DI.galleryPostsRepository)
		private galleryPostsRepository: GalleryPostsRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private galleryPostEntityService: GalleryPostEntityService,
		private idService: IdService,
	) {
		super(async (ps, me) => {
			const files = (await Promise.all(ps.fileIds.map(fileId =>
				this.driveFilesRepository.findOneBy({
					id: fileId,
					userId: me.id,
				}),
			))).filter((file): file is DriveFile => file != null);

			if (files.length === 0) {
				throw new Error();
			}

			const post = await this.galleryPostsRepository.insert(new GalleryPost({
				id: this.idService.genId(),
				createdAt: new Date(),
				updatedAt: new Date(),
				title: ps.title,
				description: ps.description,
				userId: me.id,
				isSensitive: ps.isSensitive,
				fileIds: files.map(file => file.id),
			})).then(x => this.galleryPostsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.galleryPostEntityService.pack(post, me);
		});
	}
}
