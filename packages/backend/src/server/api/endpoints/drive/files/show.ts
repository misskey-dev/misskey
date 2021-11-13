import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { DriveFile } from '@/models/entities/drive-file';
import { DriveFiles } from '@/models/index';

export const meta = {
	tags: ['drive'],

	requireCredential: true as const,

	kind: 'read:drive',

	params: {
		fileId: {
			validator: $.optional.type(ID),
		},

		url: {
			validator: $.optional.str,
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'DriveFile',
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '067bc436-2718-4795-b0fb-ecbe43949e31'
		},

		accessDenied: {
			message: 'Access denied.',
			code: 'ACCESS_DENIED',
			id: '25b73c73-68b1-41d0-bad1-381cfdf6579f'
		},

		fileIdOrUrlRequired: {
			message: 'fileId or url required.',
			code: 'INVALID_PARAM',
			id: '89674805-722c-440c-8d88-5641830dc3e4'
		}
	}
};

export default define(meta, async (ps, user) => {
	let file: DriveFile | undefined;

	if (ps.fileId) {
		file = await DriveFiles.findOne(ps.fileId);
	} else if (ps.url) {
		file = await DriveFiles.findOne({
			where: [{
				url: ps.url
			}, {
				webpublicUrl: ps.url
			}, {
				thumbnailUrl: ps.url
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
		self: true
	});
});
