'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFile from '../../../models/drive-file';
import serialize from '../../../serializers/drive-file';

/**
 * Find a file(s)
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'name' parameter
	const name = params.name;
	if (name === undefined || name === null) {
		return rej('name is required');
	}

	// Get 'folder_id' parameter
	let folder = params.folder_id;
	if (folder === undefined || folder === null) {
		folder = null;
	} else {
		folder = new mongo.ObjectID(folder);
	}

	// Issue query
	const files = await DriveFile
		.find({
			name: name,
			user_id: user._id,
			folder_id: folder
		}, {
			fields: {
				data: false
			}
		});

	// Serialize
	res(await Promise.all(files.map(async file =>
		await serialize(file))));
});
