/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFolder from '../../../models/drive-folder';
import serialize from '../../../serializers/drive-folder';

/**
 * Show a folder
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'folder_id' parameter
	const [folderId, folderIdErr] = $(params.folder_id).id().$;
	if (folderIdErr) return rej('invalid folder_id param');

	// Get folder
	const folder = await DriveFolder
		.findOne({
			_id: folderId,
			user_id: user._id
		});

	if (folder === null) {
		return rej('folder-not-found');
	}

	// Serialize
	res(await serialize(folder, {
		detail: true
	}));
});
