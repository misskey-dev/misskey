/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFolder, { pack } from '../../../models/drive-folder';

/**
 * Find a folder(s)
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = $(params.name).string().$;
	if (nameErr) return rej('invalid name param');

	// Get 'parentId' parameter
	const [parentId = null, parentIdErr] = $(params.parentId).optional.nullable.id().$;
	if (parentIdErr) return rej('invalid parentId param');

	// Issue query
	const folders = await DriveFolder
		.find({
			name: name,
			userId: user._id,
			parentId: parentId
		});

	// Serialize
	res(await Promise.all(folders.map(folder => pack(folder))));
});
