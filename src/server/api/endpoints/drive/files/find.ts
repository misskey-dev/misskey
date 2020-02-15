import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { DriveFiles } from '../../../../../models';

export const meta = {
	requireCredential: true as const,

	tags: ['drive'],

	kind: 'read:drive',

	params: {
		name: {
			validator: $.str
		},

		folderId: {
			validator: $.optional.nullable.type(ID),
			default: null as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'DriveFile',
		}
	},
};

export default define(meta, async (ps, user) => {
	const files = await DriveFiles.find({
		name: ps.name,
		userId: user.id,
		folderId: ps.folderId
	});

	return await Promise.all(files.map(file => DriveFiles.pack(file, { self: true })));
});
