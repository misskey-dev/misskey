/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import DriveFolder, { pack } from '../../../../../models/drive-folder';

/**
 * Find a folder(s)
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'name' parameter
	const [name, nameErr] = $.str.get(params.name);
	if (nameErr) return rej('invalid name param');

	// Get 'parentId' parameter
	const [parentId = null, parentIdErr] = $.type(ID).optional().nullable().get(params.parentId);
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
