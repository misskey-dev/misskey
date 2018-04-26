/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';

/**
 * Find a file(s)
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = $(params.name).string().$;
	if (nameErr) return rej('invalid name param');

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $(params.folderId).optional.nullable.type(ID).$;
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
