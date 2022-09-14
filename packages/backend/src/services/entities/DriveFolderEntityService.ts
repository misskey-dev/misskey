import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { DriveFiles, DriveFolders } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { DriveFolder } from '@/models/entities/drive-folder.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class DriveFolderEntityService {
	constructor(
		@Inject('driveFoldersRepository')
		private driveFoldersRepository: typeof DriveFolders,

		@Inject('driveFilesRepository')
		private driveFilesRepository: typeof DriveFiles,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: DriveFolder['id'] | DriveFolder,
		options?: {
			detail: boolean
		},
	): Promise<Packed<'DriveFolder'>> {
		const opts = Object.assign({
			detail: false,
		}, options);

		const folder = typeof src === 'object' ? src : await this.driveFoldersRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: folder.id,
			createdAt: folder.createdAt.toISOString(),
			name: folder.name,
			parentId: folder.parentId,

			...(opts.detail ? {
				foldersCount: this.driveFoldersRepository.countBy({
					parentId: folder.id,
				}),
				filesCount: this.driveFilesRepository.countBy({
					folderId: folder.id,
				}),

				...(folder.parentId ? {
					parent: this.pack(folder.parentId, {
						detail: true,
					}),
				} : {}),
			} : {}),
		});
	}
}

