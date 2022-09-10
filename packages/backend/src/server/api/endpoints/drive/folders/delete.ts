import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { publishDriveStream } from '@/services/stream.js';
import { DriveFolders, DriveFiles } from '@/models/index.js';
import { ApiError } from '../../../error.js';

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
		@Inject('usersRepository')
    private usersRepository: typeof Users,

		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			// Get folder
			const folder = await DriveFolders.findOneBy({
				id: ps.folderId,
				userId: user.id,
			});

			if (folder == null) {
				throw new ApiError(meta.errors.noSuchFolder);
			}

			const [childFoldersCount, childFilesCount] = await Promise.all([
				DriveFolders.countBy({ parentId: folder.id }),
				DriveFiles.countBy({ folderId: folder.id }),
			]);

			if (childFoldersCount !== 0 || childFilesCount !== 0) {
				throw new ApiError(meta.errors.hasChildFilesOrFolders);
			}

			await DriveFolders.delete(folder.id);

			// Publish folderCreated event
			publishDriveStream(user.id, 'folderDeleted', folder.id);
		});
	}
}
