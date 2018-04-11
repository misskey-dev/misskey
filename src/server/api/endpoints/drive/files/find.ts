/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFile, { pack } from '../../../../../models/drive-file';

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

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $(params.folderId).optional.nullable.id().$;
	if (folderIdErr) return rej('invalid folderId param');

	// Issue query
	const files = await DriveFile
		.find({
			filename: name,
			'metadata.userId': user._id,
			'metadata.folderId': folderId
		});

	// Serialize
	res(await Promise.all(files.map(async file =>
		await pack(file))));
});
