/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import DriveFolder, { isValidFolderName, pack } from '../../../../../models/drive-folder';
import { publishDriveStream } from '../../../../../publishers/stream';

/**
 * Create drive folder
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name = '無題のフォルダー', nameErr] = $.str.optional().pipe(isValidFolderName).get(params.name);
	if (nameErr) return rej('invalid name param');

	// Get 'parentId' parameter
	const [parentId = null, parentIdErr] = $.type(ID).optional().nullable().get(params.parentId);
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
