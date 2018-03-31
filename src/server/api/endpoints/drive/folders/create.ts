/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../common/event';

/**
 * Create drive folder
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name = '無題のフォルダー', nameErr] = $(params.name).optional.string().pipe(isValidFolderName).$;
	if (nameErr) return rej('invalid name param');

	// Get 'parentId' parameter
	const [parentId = null, parentIdErr] = $(params.parentId).optional.nullable.id().$;
	if (parentIdErr) return rej('invalid parentId param');

	// If the parent folder is specified
	let parent = null;
	if (parentId) {
		// Fetch parent folder
		parent = await DriveFolder
			.findOne({
				_id: parentId,
				userId: user._id
			});

		if (parent === null) {
			return rej('parent-not-found');
		}
	}

	// Create folder
	const folder = await DriveFolder.insert({
		createdAt: new Date(),
		name: name,
		parentId: parent !== null ? parent._id : null,
		userId: user._id
	});

	// Serialize
	const folderObj = await pack(folder);

	// Response
	res(folderObj);

	// Publish folder_created event
	publishDriveStream(user._id, 'folder_created', folderObj);
});
