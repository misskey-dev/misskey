import ms from 'ms';
import { addFile } from '@/services/drive/add-file.js';
import { DriveFiles } from '@/models/index.js';
import { DB_MAX_IMAGE_COMMENT_LENGTH } from '@/misc/hard-limits.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import define from '../../../define.js';
import { apiLogger } from '../../../logger.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	limit: {
		duration: ms('1hour'),
		max: 120,
	},

	requireFile: true,

	kind: 'write:drive',

	description: 'Upload a new drive file.',

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

		inappropriate: {
			message: 'Cannot upload the file because it has been determined that it possibly contains inappropriate content.',
			code: 'INAPPROPRIATE',
			id: 'bec5bd69-fba3-43c9-b4fb-2894b66ad5d2',
		},

		noFreeSpace: {
			message: 'Cannot upload the file because you have no free space of drive.',
			code: 'NO_FREE_SPACE',
			id: 'd08dbc37-a6a9-463a-8c47-96c32ab5f064',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		name: { type: 'string', nullable: true, default: null },
		comment: { type: 'string', nullable: true, maxLength: DB_MAX_IMAGE_COMMENT_LENGTH, default: null },
		isSensitive: { type: 'boolean', default: false },
		force: { type: 'boolean', default: false },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user, _, file, cleanup, ip, headers) => {
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

	const meta = await fetchMeta();

	try {
		// Create file
		const driveFile = await addFile({
			user,
			path: file.path,
			name,
			comment: ps.comment,
			folderId: ps.folderId,
			force: ps.force,
			sensitive: ps.isSensitive,
			requestIp: meta.enableIpLogging ? ip : null,
			requestHeaders: meta.enableIpLogging ? headers : null,
		});
		return await DriveFiles.pack(driveFile, { self: true });
	} catch (e) {
		if (e instanceof Error || typeof e === 'string') {
			apiLogger.error(e);
		}
		if (e instanceof IdentifiableError) {
			if (e.id === '282f77bf-5816-4f72-9264-aa14d8261a21') throw new ApiError(meta.errors.inappropriate);
			if (e.id === 'c6244ed2-a39a-4e1c-bf93-f0fbd7764fa6') throw new ApiError(meta.errors.noFreeSpace);
		}
		throw new ApiError();
	} finally {
		cleanup!();
	}
});
