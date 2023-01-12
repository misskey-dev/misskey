import { Inject, Injectable } from '@nestjs/common';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Show the properties of a drive file.',

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
	},
} as const;

export const paramDef = {
	type: 'object',
	anyOf: [
		{
			properties: {
				fileId: { type: 'string', format: 'misskey:id' },
			},
			required: ['fileId'],
		},
		{
			properties: {
				url: { type: 'string' },
			},
			required: ['url'],
		},
	],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			let file: DriveFile | null = null;

			if (ps.fileId) {
				file = await this.driveFilesRepository.findOneBy({ id: ps.fileId });
			} else if (ps.url) {
				file = await this.driveFilesRepository.findOne({
					where: [{
						url: ps.url,
					}, {
						webpublicUrl: ps.url,
					}, {
						thumbnailUrl: ps.url,
					}],
				});
			}

			if (file == null) {
				throw new ApiError(meta.errors.noSuchFile);
			}

			if (!await this.roleService.isModerator(me) && (file.userId !== me.id)) {
				throw new ApiError(meta.errors.accessDenied);
			}

			return await this.driveFileEntityService.pack(file, {
				detail: true,
				withUser: true,
				self: true,
			});
		});
	}
}
