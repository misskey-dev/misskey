import define from '../../../define.js';
import { DriveFiles } from '@/models/index.js';
import { IsNull } from 'typeorm';

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
export default define(meta, paramDef, async (ps, user) => {
	const files = await DriveFiles.findBy({
		name: ps.name,
		userId: user.id,
		folderId: ps.folderId ?? IsNull(),
	});

	return await Promise.all(files.map(file => DriveFiles.pack(file, { self: true })));
});
