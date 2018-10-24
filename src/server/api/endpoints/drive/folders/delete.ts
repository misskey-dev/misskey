import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFolder from '../../../../../models/drive-folder';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';
import { publishDriveStream } from '../../../../../stream';
import DriveFile from '../../../../../models/drive-file';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダを削除します。',
		'en-US': 'Delete specified folder of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

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

	const [childFoldersCount, childFilesCount] = await Promise.all([
		DriveFolder.count({ parentId: folder._id }),
		DriveFile.count({ folderId: folder._id })
	]);

	if (childFoldersCount !== 0 || childFilesCount !== 0) {
		return rej('has-child-contents');
	}

	await DriveFolder.remove({ _id: folder._id });

	// Publish folderCreated event
	publishDriveStream(user._id, 'folderDeleted', folder._id);

	res();
});
