import $ from 'cafy';
import define from '../../../define';
import { DriveFiles } from '@/models/index';

export const meta = {
	tags: ['drive'],

	requireCredential: true as const,

	kind: 'read:drive',

	params: {
		md5: {
			validator: $.str,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'DriveFile',
		},
	},
};

export default define(meta, async (ps, user) => {
	const files = await DriveFiles.find({
		md5: ps.md5,
		userId: user.id,
	});

	return await DriveFiles.packMany(files, { self: true });
});
