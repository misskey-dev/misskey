import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	requireCredential: true,

	kind: 'drive-read',

	params: {
		name: {
			validator: $.str
		},

		folderId: {
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

	const files = await DriveFile
		.find({
			filename: name,
			'metadata.userId': user._id,
			'metadata.folderId': ps.folderId
		});

	res(await Promise.all(files.map(file => pack(file))));
});
