import $ from 'cafy';
import define from '../../../define';
import { DriveFiles } from '@/models/index';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	params: {
		md5: {
			validator: $.str,
		},
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
		md5: ps.md5,
		userId: user.id,
	});

	return await DriveFiles.packMany(files, { self: true });
});
