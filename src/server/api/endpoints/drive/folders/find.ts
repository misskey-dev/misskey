import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder, { pack } from '../../../../../models/drive-folder';
import define from '../../../define';

export const meta = {
	requireCredential: true,

	kind: 'drive-read',

	params: {
		name: {
			validator: $.str
		},

		parentId: {
			validator: $.optional.nullable.type(ID),
			transform: transform,
			default: null as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const folders = await DriveFolder
		.find({
			name: ps.name,
			userId: user._id,
			parentId: ps.parentId
		});

	res(await Promise.all(folders.map(folder => pack(folder))));
}));
