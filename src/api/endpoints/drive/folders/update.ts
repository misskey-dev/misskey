/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFolder, { isValidFolderName, pack } from '../../../models/drive-folder';
import { publishDriveStream } from '../../../event';

/**
 * Update a folder
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'folder_id' parameter
	const [folderId, folderIdErr] = $(params.folder_id).id().$;
	if (folderIdErr) return rej('invalid folder_id param');

	// Fetch folder
	const folder = await DriveFolder
		.findOne({
			_id: folderId,
			user_id: user._id
		});

	if (folder === null) {
		return rej('folder-not-found');
	}

	// Get 'name' parameter
	const [name, nameErr] = $(params.name).optional.string().pipe(isValidFolderName).$;
	if (nameErr) return rej('invalid name param');
	if (name) folder.name = name;

	// Get 'parent_id' parameter
	const [parentId, parentIdErr] = $(params.parent_id).optional.nullable.id().$;
	if (parentIdErr) return rej('invalid parent_id param');
	if (parentId !== undefined) {
		if (parentId === null) {
			folder.parent_id = null;
		} else {
			// Get parent folder
			const parent = await DriveFolder
				.findOne({
					_id: parentId,
					user_id: user._id
				});

			if (parent === null) {
				return rej('parent-folder-not-found');
			}

			// Check if the circular reference will occur
			async function checkCircle(folderId) {
				// Fetch folder
				const folder2 = await DriveFolder.findOne({
					_id: folderId
				}, {
					_id: true,
					parent_id: true
				});

				if (folder2._id.equals(folder._id)) {
					return true;
				} else if (folder2.parent_id) {
					return await checkCircle(folder2.parent_id);
				} else {
					return false;
				}
			}

			if (parent.parent_id !== null) {
				if (await checkCircle(parent.parent_id)) {
					return rej('detected-circular-definition');
				}
			}

			folder.parent_id = parent._id;
		}
	}

	// Update
	DriveFolder.update(folder._id, {
		$set: {
			name: folder.name,
			parent_id: folder.parent_id
		}
	});

	// Serialize
	const folderObj = await pack(folder);

	// Response
	res(folderObj);

	// Publish folder_updated event
	publishDriveStream(user._id, 'folder_updated', folderObj);
});
