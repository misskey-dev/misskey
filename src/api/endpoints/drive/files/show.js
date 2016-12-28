'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFile from '../../../models/drive-file';
import serialize from '../../../serializers/drive-file';

/**
 * Show a file
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'file_id' parameter
	const fileId = params.file_id;
	if (fileId === undefined || fileId === null) {
		return rej('file_id is required');
	}

	const file = await DriveFile
		.findOne({
			_id: new mongo.ObjectID(fileId),
			user_id: user._id
		}, {
			data: false
		});

	if (file === null) {
		return rej('file-not-found');
	}

	// Serialize
	res(await serialize(file));
});
