import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DriveFiles } from '@/models/index.js';
import { DriveFileEntityService } from '@/services/entities/DriveFileEntityService.js';

export const meta = {
	requireCredential: true,

	tags: ['drive'],

	kind: 'read:drive',

	description: 'Search for a drive file by the given parameters.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'DriveFile',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		folderId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private driveFileEntityService: DriveFileEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const files = await DriveFiles.findBy({
				name: ps.name,
				userId: me.id,
				folderId: ps.folderId ?? IsNull(),
			});

			return await Promise.all(files.map(file => this.driveFileEntityService.pack(file, { self: true })));
		});
	}
}
