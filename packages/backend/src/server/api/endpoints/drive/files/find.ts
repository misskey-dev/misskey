import define from '../../../define.js';
import { DriveFiles } from '@/models/index.js';

export const meta = {
	requireCredential: true,

	tags: ['drive'],

	kind: 'read:drive',

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
	const files = await DriveFiles.find({
		name: ps.name,
		userId: user.id,
		folderId: ps.folderId,
	});

	return await Promise.all(files.map(file => DriveFiles.pack(file, { self: true })));
});
