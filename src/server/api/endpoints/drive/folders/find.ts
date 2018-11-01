import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder, { pack } from '../../../../../models/drive-folder';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	requireCredential: true,

	kind: 'drive-read',

	params: {
		name: {
			validator: $.str
		},

		parentId: {
			validator: $.type(ID).optional.nullable,
			transform: transform,
			default: null as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const folders = await DriveFolder
		.find({
			name: name,
			userId: user._id,
			parentId: ps.parentId
		});

	res(await Promise.all(folders.map(folder => pack(folder))));
});
