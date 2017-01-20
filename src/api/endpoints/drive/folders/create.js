'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFolder from '../../../models/drive-folder';
import { isValidFolderName } from '../../../models/drive-folder';
import serialize from '../../../serializers/drive-folder';
import event from '../../../event';

/**
 * Create drive folder
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'name' parameter
	let name = params.name;
	if (name !== undefined && name !== null) {
		name = name.trim();
		if (name.length === 0) {
			name = null;
		} else if (!isValidFolderName(name)) {
			return rej('invalid name');
		}
	} else {
		name = null;
	}

	if (name == null) {
		name = '無題のフォルダー';
	}

	// Get 'folder_id' parameter
	let parentId = params.folder_id;
	if (parentId === undefined || parentId === null) {
		parentId = null;
	} else {
		parentId = new mongo.ObjectID(parentId);
	}

	// If the parent folder is specified
	let parent = null;
	if (parentId !== null) {
		parent = await DriveFolder
			.findOne({
				_id: parentId,
				user_id: user._id
			});

		if (parent === null) {
			return reject('parent-not-found');
		}
	}

	// Create folder
	const folder = await DriveFolder.insert({
		created_at: new Date(),
		name: name,
		parent_id: parent !== null ? parent._id : null,
		user_id: user._id
	});

	// Serialize
	const folderObj = await serialize(folder);

	// Response
	res(folderObj);

	// Publish drive_folder_created event
	event(user._id, 'drive_folder_created', folderObj);
});
