import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFolder, { pack } from '../../../../../models/drive-folder';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を取得します。'
	},

	requireCredential: true,

	kind: 'drive-read'
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'folderId' parameter
	const [folderId, folderIdErr] = $.type(ID).get(params.folderId);
	if (folderIdErr) return rej('invalid folderId param');

	// Get folder
	const folder = await DriveFolder
		.findOne({
			_id: folderId,
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
