import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { DriveService } from '@/core/DriveService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files/delete'> {
	name = 'drive/files/delete' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
		private roleService: RoleService,
		private globalEventService: GlobalEventService,
	) {
		super(async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (file == null) {
				throw new ApiError(this.meta.errors.noSuchFile);
			}

			if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
				throw new ApiError(this.meta.errors.accessDenied);
			}

			// Delete
			await this.driveService.deleteFile(file);

			// Publish fileDeleted event
			this.globalEventService.publishDriveStream(me.id, 'fileDeleted', file.id);
		});
	}
}
