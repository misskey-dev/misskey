import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder from '../../../../../models/drive-folder';
import define from '../../../define';
import { publishDriveStream } from '../../../../../services/stream';
import DriveFile from '../../../../../models/drive-file';
import { ApiError } from '../../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダを削除します。',
		'en-US': 'Delete specified folder of drive.'
	},

	tags: ['drive'],

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
	},

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: '1069098f-c281-440f-b085-f9932edbe091'
		},

		hasChildFilesOrFolders: {
			message: 'This folder has child files or folders.',
			code: 'HAS_CHILD_FILES_OR_FOLDERS',
			id: 'b0fc8a17-963c-405d-bfbc-859a487295e1'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Get folder
	const folder = await DriveFolder
		.findOne({
			_id: ps.folderId,
			userId: user._id
		});

	if (folder === null) {
		throw new ApiError(meta.errors.noSuchFolder);
	}

	const [childFoldersCount, childFilesCount] = await Promise.all([
		DriveFolder.count({ parentId: folder._id }),
		DriveFile.count({ 'metadata.folderId': folder._id })
	]);

	if (childFoldersCount !== 0 || childFilesCount !== 0) {
		throw new ApiError(meta.errors.hasChildFilesOrFolders);
	}

	await DriveFolder.remove({ _id: folder._id });

	// Publish folderCreated event
	publishDriveStream(user._id, 'folderDeleted', folder._id);

	return;
});
