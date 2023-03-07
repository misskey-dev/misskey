import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DriveService } from '@/core/DriveService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['drive'],

	limit: {
		duration: ms('1hour'),
		max: 60,
	},

	description: 'Request the server to download a new drive file from the specified URL.',

	requireCredential: true,

	kind: 'write:drive',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		url: { type: 'string' },
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
		isSensitive: { type: 'boolean', default: false },
		comment: { type: 'string', nullable: true, maxLength: 512, default: null },
		marker: { type: 'string', nullable: true, default: null },
		force: { type: 'boolean', default: false },
	},
	required: ['url'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private driveService: DriveService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, user, _1, _2, _3, ip, headers) => {
			this.driveService.uploadFromUrl({ url: ps.url, user, folderId: ps.folderId, sensitive: ps.isSensitive, force: ps.force, comment: ps.comment, requestIp: ip, requestHeaders: headers }).then(file => {
				this.driveFileEntityService.pack(file, { self: true }).then(packedFile => {
					this.globalEventService.publishMainStream(user.id, 'urlUploadFinished', {
						marker: ps.marker,
						file: packedFile,
					});
				});
			});
		});
	}
}
