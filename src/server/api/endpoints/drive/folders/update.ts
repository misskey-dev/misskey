import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../services/stream';
import define from '../../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を更新します。',
		'en-US': 'Update specified folder of drive.'
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
		},

		name: {
			validator: $.optional.str.pipe(isValidFolderName),
			desc: {
				'ja-JP': 'フォルダ名',
				'en-US': 'Folder name'
			}
		},

		parentId: {
			validator: $.optional.nullable.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '親フォルダID',
				'en-US': 'Parent folder ID'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Fetch folder
	const folder = await DriveFolder
		.findOne({
			_id: ps.folderId,
			userId: user._id
		});

	if (folder === null) {
		return rej('folder-not-found');
	}

	if (ps.name) folder.name = ps.name;

	if (ps.parentId !== undefined) {
		if (ps.parentId === null) {
			folder.parentId = null;
		} else {
			// Get parent folder
			const parent = await DriveFolder
				.findOne({
					_id: ps.parentId,
					userId: user._id
				});

			if (parent === null) {
				return rej('parent-folder-not-found');
			}

			// Check if the circular reference will occur
			async function checkCircle(folderId: any): Promise<boolean> {
				// Fetch folder
				const folder2 = await DriveFolder.findOne({
					_id: folderId
				}, {
					_id: true,
					parentId: true
				});

				if (folder2._id.equals(folder._id)) {
					return true;
				} else if (folder2.parentId) {
					return await checkCircle(folder2.parentId);
				} else {
					return false;
				}
			}

			if (parent.parentId !== null) {
				if (await checkCircle(parent.parentId)) {
					return rej('detected-circular-definition');
				}
			}

			folder.parentId = parent._id;
		}
	}

	// Update
	DriveFolder.update(folder._id, {
		$set: {
			name: folder.name,
			parentId: folder.parentId
		}
	});

	// Serialize
	const folderObj = await pack(folder);

	// Response
	res(folderObj);

	// Publish folderUpdated event
	publishDriveStream(user._id, 'folderUpdated', folderObj);
}));
