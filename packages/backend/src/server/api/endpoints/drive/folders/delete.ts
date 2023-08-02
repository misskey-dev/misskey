import { In } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFoldersRepository, DriveFilesRepository, DriveFile, User, DriveFolder } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';
import { DriveService } from '@/core/DriveService.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '1069098f-c281-440f-b085-f9932edbe091',
		},

		hasChildFilesOrFolders: {
			message: 'This folder has child files or folders.',
			code: 'HAS_CHILD_FILES_OR_FOLDERS',
			id: 'b0fc8a17-963c-405d-bfbc-859a487295e1',
		},
		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '5eb8d909-2540-4970-90b8-dd6f86088121',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		folderId: { type: 'string', format: 'misskey:id' },
	},
	required: ['folderId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveService: DriveService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Get folder
			const folder = await this.driveFoldersRepository.findOneBy({
				id: ps.folderId,
				userId: me.id,
			});

			if (folder == null) {
				throw new ApiError(meta.errors.noSuchFolder);
			}

			const [childFoldersCount, childFilesCount] = await Promise.all([
				this.driveFoldersRepository.countBy({ parentId: folder.id }),
				this.driveFilesRepository.countBy({ folderId: folder.id }),
			]);

			if (!await this.roleService.isModerator(me) && (folder.userId !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			// TODO: 再帰的に消す
			if (childFoldersCount !== 0 || childFilesCount !== 0) {
				const innerFolders: DriveFolder[] = [];

				let NonInnerFolderFlag = true;
				let unCheckedInnerFolders: DriveFolder[] = [folder];
				do {
					const newInnerFolders: DriveFolder[] = await this.driveFoldersRepository.findBy({
						parentId: In(unCheckedInnerFolders.map(v => v.id))
					});

					innerFolders.push(...unCheckedInnerFolders);
					unCheckedInnerFolders = newInnerFolders;

					NonInnerFolderFlag = newInnerFolders.length === 0;
				} while (!NonInnerFolderFlag);

				const files: DriveFile[] = await this.driveFilesRepository.findBy({
					folderId: In(innerFolders.map(v => v.id))
				});

				for (const file of files) {
					// ここはfile deleteのものを持ってきてる
					// Delete
					await this.driveService.deleteFile(file);

					// Publish fileDeleted event
					this.globalEventService.publishDriveStream(me.id, "fileDeleted", file.id);
				}

				await this.driveFoldersRepository.delete({ id: In(innerFolders.map(v => v.id)) });

				// Publish folderCreated event
				for (const folder of innerFolders) {
					this.globalEventService.publishDriveStream(me.id, 'folderDeleted', folder.id);
				}
			}
			else {
				await this.driveFoldersRepository.delete(folder.id);

				// Publish folderCreated event
				this.globalEventService.publishDriveStream(me.id, 'folderDeleted', folder.id);
			}
		});
	}
}
