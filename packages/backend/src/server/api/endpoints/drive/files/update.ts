import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, DriveFoldersRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files/update'> {
	name = 'drive/files/update' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
		private globalEventService: GlobalEventService,
	) {
		super(async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
			const alwaysMarkNsfw = (await this.roleService.getUserPolicies(me.id)).alwaysMarkNsfw;
			if (file == null) {
				throw new ApiError(this.meta.errors.noSuchFile);
			}

			if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
				throw new ApiError(this.meta.errors.accessDenied);
			}

			if (ps.name) file.name = ps.name;
			if (!this.driveFileEntityService.validateFileName(file.name)) {
				throw new ApiError(this.meta.errors.invalidFileName);
			}

			if (ps.comment !== undefined) file.comment = ps.comment;

			if (ps.isSensitive !== undefined && ps.isSensitive !== file.isSensitive && alwaysMarkNsfw && !ps.isSensitive) {
				throw new ApiError(this.meta.errors.restrictedByRole);
			}

			if (ps.isSensitive !== undefined) file.isSensitive = ps.isSensitive;

			if (ps.folderId !== undefined) {
				if (ps.folderId === null) {
					file.folderId = null;
				} else {
					const folder = await this.driveFoldersRepository.findOneBy({
						id: ps.folderId,
						userId: me.id,
					});

					if (folder == null) {
						throw new ApiError(this.meta.errors.noSuchFolder);
					}

					file.folderId = folder.id;
				}
			}

			await this.driveFilesRepository.update(file.id, {
				name: file.name,
				comment: file.comment,
				folderId: file.folderId,
				isSensitive: file.isSensitive,
			});

			const fileObj = await this.driveFileEntityService.pack(file, { self: true });

			// Publish fileUpdated event
			this.globalEventService.publishDriveStream(me.id, 'fileUpdated', fileObj);

			return fileObj;
		});
	}
}
