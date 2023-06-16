import { Inject, Injectable } from '@nestjs/common';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/files/show'> {
	name = 'drive/files/show' as const;
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
	) {
		super(async (ps, me) => {
			let file: DriveFile | null = null;

			if (ps.fileId) {
				file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
			} else if (ps.url) {
				file = await this.driveFilesRepository.findOne({
					where: [{
						url: ps.url,
					}, {
						webpublicUrl: ps.url,
					}, {
						thumbnailUrl: ps.url,
					}],
				});
			}

			if (file == null) {
				throw new ApiError(this.meta.errors.noSuchFile);
			}

			if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
				throw new ApiError(this.meta.errors.accessDenied);
			}

			return await this.driveFileEntityService.pack(file, {
				detail: true,
				withUser: true,
				self: true,
			});
		});
	}
}
