import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { DriveFolders } from '../../../../../models';
import { types, bool } from '../../../../../misc/schema';

export const meta = {
	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	params: {
		name: {
			validator: $.str
		},

		parentId: {
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
			ref: 'DriveFolder',
		}
	},
};

export default define(meta, async (ps, user) => {
	const folders = await DriveFolders.find({
		name: ps.name,
		userId: user.id,
		parentId: ps.parentId
	});

	return await Promise.all(folders.map(folder => DriveFolders.pack(folder)));
});
