import { Inject, Injectable } from '@nestjs/common';
import { DriveFiles } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	description: 'Search for a drive file by a hash of the contents.',

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
		md5: { type: 'string' },
	},
	required: ['md5'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('notesRepository')
    private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, user) => {
			const files = await DriveFiles.findBy({
				md5: ps.md5,
				userId: user.id,
			});

			return await DriveFiles.packMany(files, { self: true });
		});
	}
}
