import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files/find-by-hash'> {
	name = 'drive/files/find-by-hash' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
	) {
		super(async (ps, me) => {
			const files = await this.driveFilesRepository.findBy({
				md5: ps.md5,
				userId: me.id,
			});

			return await this.driveFileEntityService.packMany(files, { self: true });
		});
	}
}
