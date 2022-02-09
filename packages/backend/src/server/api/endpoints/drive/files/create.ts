import ms from 'ms';
import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { addFile } from '@/services/drive/add-file';
import define from '../../../define';
import { apiLogger } from '../../../logger';
import { ApiError } from '../../../error';
import { DriveFiles } from '@/models/index';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 120,
	},

	requireFile: true,

	kind: 'write:drive',

	params: {
		folderId: {
			validator: $.optional.nullable.type(ID),
			default: null,
		},

		name: {
			validator: $.optional.nullable.str,
			default: null,
		},

		comment: {
			validator: $.optional.nullable.str.max(DB_MAX_IMAGE_COMMENT_LENGTH),
			default: null,
		},

		isSensitive: {
			validator: $.optional.bool,
			default: false,
		},

		force: {
			validator: $.optional.bool,
			default: false,
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFile',
	},

	errors: {
		invalidFileName: {
			message: 'Invalid file name.',
			code: 'INVALID_FILE_NAME',
			id: 'f449b209-0c60-4e51-84d5-29486263bfd4',
		},
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user, _, file, cleanup) => {
	// Get 'name' parameter
	let name = ps.name || file.originalname;
	if (name !== undefined && name !== null) {
		name = name.trim();
		if (name.length === 0) {
			name = null;
		} else if (name === 'blob') {
			name = null;
		} else if (!DriveFiles.validateFileName(name)) {
			throw new ApiError(meta.errors.invalidFileName);
		}
	} else {
		name = null;
	}

	try {
		// Create file
		const driveFile = await addFile({ user, path: file.path, name, comment: ps.comment, folderId: ps.folderId, force: ps.force, sensitive: ps.isSensitive });
		return await DriveFiles.pack(driveFile, { self: true });
	} catch (e) {
		if (e instanceof Error || typeof e === 'string') {
			apiLogger.error(e);
		}
		throw new ApiError();
	} finally {
		cleanup!();
	}
});
