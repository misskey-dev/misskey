/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFile from '../../../models/drive-file';
import serialize from '../../../serializers/drive-file';

/**
 * Find a file(s)
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = $(params.name).string().$;
	if (nameErr) return rej('invalid name param');

	// Get 'folder_id' parameter
	const [folderId = null, folderIdErr] = $(params.folder_id).optional.nullable.id().$;
	if (folderIdErr) return rej('invalid folder_id param');

	// Issue query
	const files = await DriveFile
		.find({
			metadata: {
				name: name,
				user_id: user._id,
				folder_id: folderId
			}
		});

	// Serialize
	res(await Promise.all(files.map(async file =>
		await serialize(file))));
});
