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

	// Get 'parent_id' parameter
	const [parentId = null, parentIdErr] = $(params.parent_id).optional.nullable.id().$;
	if (parentIdErr) return rej('invalid parent_id param');

	// Issue query
	const folders = await DriveFolder
		.find({
			name: name,
			user_id: user._id,
			parent_id: parentId
		});

	// Serialize
	res(await Promise.all(folders.map(folder => pack(folder))));
});
