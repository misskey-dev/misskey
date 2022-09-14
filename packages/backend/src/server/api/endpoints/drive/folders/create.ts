import { Inject, Injectable } from '@nestjs/common';
import { publishDriveStream } from '@/services/stream.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { DriveFolders } from '@/models/index.js';
import { IdService } from '@/services/IdService.js';
import { DriveFolderEntityService } from '@/services/entities/DriveFolderEntityService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'write:drive',

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '53326628-a00d-40a6-a3cd-8975105c0f95',
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'DriveFolder',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', default: 'Untitled', maxLength: 200 },
		parentId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('driveFoldersRepository')
		private driveFoldersRepository: typeof DriveFolders,

		private driveFolderEntityService: DriveFolderEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// If the parent folder is specified
			let parent = null;
			if (ps.parentId) {
				// Fetch parent folder
				parent = await this.driveFoldersRepository.findOneBy({
					id: ps.parentId,
					userId: me.id,
				});

				if (parent == null) {
					throw new ApiError(meta.errors.noSuchFolder);
				}
			}

			// Create folder
			const folder = await this.driveFoldersRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				name: ps.name,
				parentId: parent !== null ? parent.id : null,
				userId: me.id,
			}).then(x => this.driveFoldersRepository.findOneByOrFail(x.identifiers[0]));

			const folderObj = await this.driveFolderEntityService.pack(folder);

			// Publish folderCreated event
			publishDriveStream(me.id, 'folderCreated', folderObj);

			return folderObj;
		});
	}
}
