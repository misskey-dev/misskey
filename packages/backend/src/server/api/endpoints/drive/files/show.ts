import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { DriveFile } from '@/models/entities/drive-file.js';
import { DriveFiles } from '@/models/index.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'DriveFile',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '067bc436-2718-4795-b0fb-ecbe43949e31',
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '25b73c73-68b1-41d0-bad1-381cfdf6579f',
		},

		fileIdOrUrlRequired: {
			message: 'fileId or url required.',
			code: 'INVALID_PARAM',
			id: '89674805-722c-440c-8d88-5641830dc3e4',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id' },
		url: { type: 'string' },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	let file: DriveFile | undefined;

	if (ps.fileId) {
		file = await DriveFiles.findOne(ps.fileId);
	} else if (ps.url) {
		file = await DriveFiles.findOne({
			where: [{
				url: ps.url,
			}, {
				webpublicUrl: ps.url,
			}, {
				thumbnailUrl: ps.url,
			}],
		});
	} else {
		throw new ApiError(meta.errors.fileIdOrUrlRequired);
	}

	if (file == null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	if (!user.isAdmin && !user.isModerator && (file.userId !== user.id)) {
		throw new ApiError(meta.errors.accessDenied);
	}

	return await DriveFiles.pack(file, {
		detail: true,
		withUser: true,
		self: true,
	});
});
