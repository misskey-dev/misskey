import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { DriveFiles } from '@/models/index';

export const meta = {
	requireCredential: true,

	tags: ['drive'],

	kind: 'read:drive',

	params: {
		type: 'object',
		properties: {
			name: { type: 'string', },
			folderId: { type: 'string', format: 'misskey:id', nullable: true, },
		},
		required: ['name'],
	},

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

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const files = await DriveFiles.find({
		name: ps.name,
		userId: user.id,
		folderId: ps.folderId,
	});

	return await Promise.all(files.map(file => DriveFiles.pack(file, { self: true })));
});
