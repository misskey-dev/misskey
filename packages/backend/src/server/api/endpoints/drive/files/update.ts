import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, DriveFoldersRepository } from '@/models/index.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	description: 'Update the properties of a drive file.',

	errors: {
		invalidFileName: {
			message: 'Invalid file name.',
			code: 'INVALID_FILE_NAME',
			id: '395e7156-f9f0-475e-af89-53c3c23080c2',
		},

		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'e7778c7e-3af9-49cd-9690-6dbc3e6c972d',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '01a53b27-82fc-445b-a0c1-b558465a8ed2',
		},

		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: 'ea8fb7a5-af77-4a08-b608-c0218176cd73',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFile',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
		folderId: { type: 'string', format: 'misskey:id', nullable: true },
		name: { type: 'string' },
		isSensitive: { type: 'boolean' },
		comment: { type: 'string', nullable: true, maxLength: 512 },
	},
	required: ['fileId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private driveFileEntityService: DriveFileEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			if ((!me.isAdmin && !me.isModerator) && (file.userId !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			if (ps.name) file.name = ps.name;
			if (!this.driveFileEntityService.validateFileName(file.name)) {
				throw new ApiError(meta.errors.invalidFileName);
			}

			if (ps.comment !== undefined) file.comment = ps.comment;

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
						throw new ApiError(meta.errors.noSuchFolder);
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
