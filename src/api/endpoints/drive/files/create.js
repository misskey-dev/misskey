'use strict';

/**
 * Module dependencies
 */
import * as fs from 'fs';
import * as mongo from 'mongodb';
import File from '../../../models/drive-file';
import { validateFileName } from '../../../models/drive-file';
import User from '../../../models/user';
import serialize from '../../../serializers/drive-file';
import create from '../../../common/add-file-to-drive';

/**
 * Create a file
 *
 * @param {Object} file
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (file, params, user) =>
	new Promise(async (res, rej) =>
{
	const buffer = fs.readFileSync(file.path);
	fs.unlink(file.path);

	// Get 'name' parameter
	let name = file.originalname;
	if (name !== undefined && name !== null) {
		name = name.trim();
		if (name.length === 0) {
			name = null;
		} else if (name === 'blob') {
			name = null;
		} else if (!validateFileName(name)) {
			return rej('invalid name');
		}
	} else {
		name = null;
	}

	// Get 'folder_id' parameter
	let folder = params.folder_id;
	if (folder === undefined || folder === null || folder === 'null') {
		folder = null;
	} else {
		folder = new mongo.ObjectID(folder);
	}

	// Create file
	const driveFile = await create(user, buffer, name, null, folder);

	// Serialize
	const fileObj = await serialize(driveFile);

	// Response
	res(fileObj);
});
