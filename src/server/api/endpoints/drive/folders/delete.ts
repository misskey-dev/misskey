import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder from '../../../../../models/drive-folder';
import define from '../../../define';
import { publishDriveStream } from '../../../../../services/stream';
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
		folderId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のフォルダID',
				'en-US': 'Target folder ID'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
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
		DriveFile.count({ 'metadata.folderId': folder._id })
	]);

	if (childFoldersCount !== 0 || childFilesCount !== 0) {
		return rej('has-child-contents');
	}

	await DriveFolder.remove({ _id: folder._id });

	// Publish folderCreated event
	publishDriveStream(user._id, 'folderDeleted', folder._id);

	res();
}));
