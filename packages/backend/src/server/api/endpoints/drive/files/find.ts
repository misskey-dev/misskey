import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files/find'> {
	name = 'drive/files/find' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
	) {
		super(async (ps, me) => {
			const files = await this.driveFilesRepository.findBy({
				name: ps.name,
				userId: me.id,
				folderId: ps.folderId ?? IsNull(),
			});

			return await Promise.all(files.map(file => this.driveFileEntityService.pack(file, { self: true })));
		});
	}
}
