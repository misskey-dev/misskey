import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFolder, { pack } from '../../../../../models/drive-folder';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を取得します。',
		'en-US': 'Get specified folder of drive.'
	},

	requireCredential: true,

	kind: 'drive-read',

	params: {
		folderId: $.type(ID).note({
			desc: {
				'ja-JP': '対象のフォルダID',
				'en-US': 'Target folder ID'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// Get folder
	const folder = await DriveFolder
		.findOne({
			_id: ps.folderId,
			userId: user._id
		});

	if (folder === null) {
		return rej('folder-not-found');
	}

	// Serialize
	res(await pack(folder, {
		detail: true
	}));
});
