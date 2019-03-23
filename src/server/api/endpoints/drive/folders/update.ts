import $ from 'cafy';
import { StringID, NumericalID } from '../../../../../misc/cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/entities/drive-folder';
import { publishDriveStream } from '../../../../../services/stream';
import define from '../../../define';
import { ApiError } from '../../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を更新します。',
		'en-US': 'Update specified folder of drive.'
	},

	tags: ['drive'],

	requireCredential: true,

	kind: 'drive-write',

	params: {
		folderId: {
			validator: $.type(StringID),
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
			validator: $.optional.nullable.type(NumericalID),
			desc: {
				'ja-JP': '親フォルダID',
				'en-US': 'Parent folder ID'
			}
		}
	},

	errors: {
		noSuchFolder: {
			message: 'No such folder.',
			code: 'NO_SUCH_FOLDER',
			id: 'f7974dac-2c0d-4a27-926e-23583b28e98e'
		},

		noSuchParentFolder: {
			message: 'No such parent folder.',
			code: 'NO_SUCH_PARENT_FOLDER',
			id: 'ce104e3a-faaf-49d5-b459-10ff0cbbcaa1'
		},

		recursiveNesting: {
			message: 'It can not be structured like nesting folders recursively.',
			code: 'NO_SUCH_PARENT_FOLDER',
			id: 'ce104e3a-faaf-49d5-b459-10ff0cbbcaa1'
		},
	}
};

export default define(meta, async (ps, user) => {
	// Fetch folder
	const folder = await DriveFolder
		.findOne({
			id: ps.folderId,
			userId: user.id
		});

	if (folder === null) {
		throw new ApiError(meta.errors.noSuchFolder);
	}

	if (ps.name) folder.name = ps.name;

	if (ps.parentId !== undefined) {
		if (ps.parentId === null) {
			folder.parentId = null;
		} else {
			// Get parent folder
			const parent = await DriveFolder
				.findOne({
					id: ps.parentId,
					userId: user.id
				});

			if (parent === null) {
				throw new ApiError(meta.errors.noSuchParentFolder);
			}

			// Check if the circular reference will occur
			async function checkCircle(folderId: any): Promise<boolean> {
				// Fetch folder
				const folder2 = await DriveFolder.findOne({
					id: folderId
				}, {
					id: true,
					parentId: true
				});

				if (folder2.id.equals(folder.id)) {
					return true;
				} else if (folder2.parentId) {
					return await checkCircle(folder2.parentId);
				} else {
					return false;
				}
			}

			if (parent.parentId !== null) {
				if (await checkCircle(parent.parentId)) {
					throw new ApiError(meta.errors.recursiveNesting);
				}
			}

			folder.parentId = parent.id;
		}
	}

	// Update
	DriveFolder.update(folder.id, {
		$set: {
			name: folder.name,
			parentId: folder.parentId
		}
	});

	const folderObj = await pack(folder);

	// Publish folderUpdated event
	publishDriveStream(user.id, 'folderUpdated', folderObj);

	return folderObj;
});
