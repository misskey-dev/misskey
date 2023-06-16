import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFoldersRepository, DriveFilesRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/folders/delete'> {
	name = 'drive/folders/delete' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private globalEventService: GlobalEventService,
	) {
		super(async (ps, me) => {
			// Get folder
			const folder = await this.driveFoldersRepository.findOneBy({
				id: ps.folderId,
				userId: me.id,
			});

			if (folder == null) {
				throw new ApiError(this.meta.errors.noSuchFolder);
			}

			const [childFoldersCount, childFilesCount] = await Promise.all([
				this.driveFoldersRepository.countBy({ parentId: folder.id }),
				this.driveFilesRepository.countBy({ folderId: folder.id }),
			]);

			if (childFoldersCount !== 0 || childFilesCount !== 0) {
				throw new ApiError(this.meta.errors.hasChildFilesOrFolders);
			}

			await this.driveFoldersRepository.delete(folder.id);

			// Publish folderCreated event
			this.globalEventService.publishDriveStream(me.id, 'folderDeleted', folder.id);
		});
	}
}
