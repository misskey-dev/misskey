import ms from 'ms';
import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import create from '@/services/drive/add-file';
import define from '../../../define';
import { apiLogger } from '../../../logger';
import { ApiError } from '../../../error';
import { DriveFiles } from '@/models/index';

export const meta = {
	tags: ['drive'],

	requireCredential: true as const,

	limit: {
		duration: ms('1hour'),
		max: 120
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

		isSensitive: {
			validator: $.optional.either($.bool, $.str),
			default: false,
			transform: (v: any): boolean => v === true || v === 'true',
		},

		force: {
			validator: $.optional.either($.bool, $.str),
			default: false,
			transform: (v: any): boolean => v === true || v === 'true',
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'DriveFile',
	},

	errors: {
		invalidFileName: {
			message: 'Invalid file name.',
			code: 'INVALID_FILE_NAME',
			id: 'f449b209-0c60-4e51-84d5-29486263bfd4'
		}
	}
};

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
		const driveFile = await create(user, file.path, name, null, ps.folderId, ps.force, false, null, null, ps.isSensitive);
		return await DriveFiles.pack(driveFile, { self: true });
	} catch (e) {
		apiLogger.error(e);
		throw new ApiError();
	} finally {
		cleanup!();
	}
});
