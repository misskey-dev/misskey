import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../stream';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を更新します。',
		'en-US': 'Update specified folder of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		folderId: $.type(ID).note({
			desc: {
				'ja-JP': '対象のフォルダID',
				'en-US': 'Target folder ID'
			}
		}),

		name: $.str.optional.pipe(isValidFolderName).note({
			desc: {
				'ja-JP': 'フォルダ名',
				'en-US': 'Folder name'
			}
		}),

		parentId: $.type(ID).optional.nullable.note({
			desc: {
				'ja-JP': '親フォルダID',
				'en-US': 'Parent folder ID'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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
});
