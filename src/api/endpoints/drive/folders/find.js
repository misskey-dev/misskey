'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFolder from '../../../models/drive-folder';
import serialize from '../../../serializers/drive-folder';

/**
 * Find a folder(s)
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'name' parameter
	const name = params.name;
	if (name === undefined || name === null) {
		return rej('name is required');
	}

	// Get 'parent_id' parameter
	let parentId = params.parent_id;
	if (parentId === undefined || parentId === null || parentId === 'null') {
		parentId = null;
	} else {
		parentId = new mongo.ObjectID(parentId);
	}

	// Issue query
	const folders = await DriveFolder
		.find({
			name: name,
			user_id: user._id,
			parent_id: parentId
		})
		.toArray();

	// Serialize
	res(await Promise.all(folders.map(async folder =>
		await serialize(folder))));
});
