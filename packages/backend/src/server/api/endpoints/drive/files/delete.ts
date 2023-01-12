import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { DriveService } from '@/core/DriveService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
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
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveService: DriveService,
		private roleService: RoleService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			// Delete
			await this.driveService.deleteFile(file);

			// Publish fileDeleted event
			this.globalEventService.publishDriveStream(me.id, 'fileDeleted', file.id);
		});
	}
}
