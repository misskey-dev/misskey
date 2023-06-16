import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFoldersRepository } from '@/models/index.js';
import { DriveFolderEntityService } from '@/core/entities/DriveFolderEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'drive/folders/update'> {
	name = 'drive/folders/update' as const;
	constructor(
		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFolderEntityService: DriveFolderEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(async (ps, me) => {
			// Fetch folder
			const folder = await this.driveFoldersRepository.findOneBy({
				id: ps.folderId,
				userId: me.id,
			});

			if (folder == null) {
				throw new ApiError(this.meta.errors.noSuchFolder);
			}

			if (ps.name) folder.name = ps.name;

			if (ps.parentId !== undefined) {
				if (ps.parentId === folder.id) {
					throw new ApiError(this.meta.errors.recursiveNesting);
				} else if (ps.parentId === null) {
					folder.parentId = null;
				} else {
					// Get parent folder
					const parent = await this.driveFoldersRepository.findOneBy({
						id: ps.parentId,
						userId: me.id,
					});

					if (parent == null) {
						throw new ApiError(this.meta.errors.noSuchParentFolder);
					}

					// Check if the circular reference will occur
					const checkCircle = async (folderId: string): Promise<boolean> => {
						// Fetch folder
						const folder2 = await this.driveFoldersRepository.findOneBy({
							id: folderId,
						});

						if (folder2!.id === folder!.id) {
							return true;
						} else if (folder2!.parentId) {
							return await checkCircle(folder2!.parentId);
						} else {
							return false;
						}
					};

					if (parent.parentId !== null) {
						if (await checkCircle(parent.parentId)) {
							throw new ApiError(this.meta.errors.recursiveNesting);
						}
					}

					folder.parentId = parent.id;
				}
			}

			// Update
			this.driveFoldersRepository.update(folder.id, {
				name: folder.name,
				parentId: folder.parentId,
			});

			const folderObj = await this.driveFolderEntityService.pack(folder);

			// Publish folderUpdated event
			this.globalEventService.publishDriveStream(me.id, 'folderUpdated', folderObj);

			return folderObj;
		});
	}
}
