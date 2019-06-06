import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { DriveFiles } from '../../../../../models';
import { types, bool } from '../../../../../misc/schema';

export const meta = {
	requireCredential: true,

	tags: ['drive'],

	kind: 'read:drive',

	params: {
		name: {
			validator: $.str
		},

		folderId: {
			validator: $.optional.nullable.type(ID),
			default: null,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
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
