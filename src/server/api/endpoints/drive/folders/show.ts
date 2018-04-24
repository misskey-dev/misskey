/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import DriveFolder, { pack } from '../../../../../models/drive-folder';

/**
 * Show a folder
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'folderId' parameter
	const [folderId, folderIdErr] = $(params.folderId).type(ID).$;
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
