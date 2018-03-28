/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFolder, { pack } from '../../../models/drive-folder';

/**
 * Show a folder
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'folderId' parameter
	const [folderId, folderIdErr] = $(params.folderId).id().$;
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
