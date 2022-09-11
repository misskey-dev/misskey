import { Inject, Injectable } from '@nestjs/common';
import { deleteFile } from '@/services/drive/delete-file.js';
import { publishDriveStream } from '@/services/stream.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFiles, Users } from '@/models/index.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	description: 'Delete an existing drive file.',

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '908939ec-e52b-4458-b395-1025195cea58',
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
		fileId: { type: 'string', format: 'misskey:id' },
	},
	required: ['fileId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await DriveFiles.findOneBy({ id: ps.fileId });

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			if ((!me.isAdmin && !me.isModerator) && (file.userId !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			// Delete
			await deleteFile(file);

			// Publish fileDeleted event
			publishDriveStream(me.id, 'fileDeleted', file.id);
		});
	}
}
