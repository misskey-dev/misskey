import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { publishDriveStream } from '@/services/stream';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFiles, DriveFolders } from '@/models/index';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	params: {
		type: 'object',
		properties: {
			fileId: { type: 'string', format: 'misskey:id', },
			folderId: { type: 'string', format: 'misskey:id', nullable: true, },
			name: { type: 'string', },
			isSensitive: { type: 'boolean', },
			comment: { type: 'string', nullable: true, maxLength: 512, },
		},
		required: ['fileId'],
	},

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

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const file = await DriveFiles.findOne(ps.fileId);

	if (file == null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	if (!user.isAdmin && !user.isModerator && (file.userId !== user.id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	if (ps.name) file.name = ps.name;
	if (!DriveFiles.validateFileName(file.name)) {
		throw new ApiError(meta.errors.invalidFileName);
	}

	if (ps.comment !== undefined) file.comment = ps.comment;

	if (ps.isSensitive !== undefined) file.isSensitive = ps.isSensitive;

	if (ps.folderId !== undefined) {
		if (ps.folderId === null) {
			file.folderId = null;
		} else {
			const folder = await DriveFolders.findOne({
				id: ps.folderId,
				userId: user.id,
			});

			if (folder == null) {
				throw new ApiError(meta.errors.noSuchFolder);
			}

			file.folderId = folder.id;
		}
	}

	await DriveFiles.update(file.id, {
		name: file.name,
		comment: file.comment,
		folderId: file.folderId,
		isSensitive: file.isSensitive,
	});

	const fileObj = await DriveFiles.pack(file, { self: true });

	// Publish fileUpdated event
	publishDriveStream(user.id, 'fileUpdated', fileObj);

	return fileObj;
});
