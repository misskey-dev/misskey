import define from '../../../define.js';
import { DriveFolders } from '@/models/index.js';
import { IsNull } from 'typeorm';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'DriveFolder',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string' },
		parentId: { type: 'string', format: 'misskey:id', nullable: true, default: null },
	},
	required: ['name'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	const folders = await DriveFolders.findBy({
		name: ps.name,
		userId: user.id,
		parentId: ps.parentId ?? IsNull(),
	});

	return await Promise.all(folders.map(folder => DriveFolders.pack(folder)));
});
