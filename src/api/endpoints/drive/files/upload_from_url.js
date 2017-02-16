'use strict';

/**
 * Module dependencies
 */
import * as URL from 'url';
const download = require('download');
import * as mongo from 'mongodb';
import File from '../../../models/drive-file';
import { validateFileName } from '../../../models/drive-file';
import User from '../../../models/user';
import serialize from '../../../serializers/drive-file';
import create from '../../../common/add-file-to-drive';

/**
 * Create a file from a URL
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'url' parameter
	const url = params.url;
	if (url == null) {
		return rej('url is required');
	}

	let name = URL.parse(url).pathname.split('/').pop();
	if (!validateFileName(name)) {
		name = null;
	}

	// Get 'folder_id' parameter
	let folder = params.folder_id;
	if (folder === undefined || folder === null) {
		folder = null;
	} else {
		folder = new mongo.ObjectID(folder);
	}

	// Download file
	const data = await download(url);

	// Create file
	const driveFile = await create(user, data, name, null, folder);

	// Serialize
	const fileObj = await serialize(driveFile);

	// Response
	res(fileObj);
});
