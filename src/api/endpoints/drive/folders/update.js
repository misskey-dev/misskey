'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFolder from '../../../models/drive-folder';
import { isValidFolderName } from '../../../models/drive-folder';
import serialize from '../../../serializers/drive-file';
import event from '../../../event';

/**
 * Update a folder
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'folder_id' parameter
	const folderId = params.folder_id;
	if (folderId === undefined || folderId === null) {
		return rej('folder_id is required');
	}

	// Fetch folder
	const folder = await DriveFolder
		.findOne({
			_id: new mongo.ObjectID(folderId),
			user_id: user._id
		});

	if (folder === null) {
		return rej('folder-not-found');
	}

	// Get 'name' parameter
	let name = params.name;
	if (name) {
		name = name.trim();
		if (isValidFolderName(name)) {
			folder.name = name;
		} else {
			return rej('invalid folder name');
		}
	}

	// Get 'parent_id' parameter
	let parentId = params.parent_id;
	if (parentId !== undefined && parentId !== 'null') {
		parentId = new mongo.ObjectID(parentId);
	}

	let parent = null;
	if (parentId !== undefined && parentId !== null) {
		if (parentId === 'null') {
			folder.parent_id = null;
		} else {
			// Get parent folder
			parent = await DriveFolder
				.findOne({
					_id: parentId,
					user_id: user._id
				});

			if (parent === null) {
				return rej('parent-folder-not-found');
			}

			// Check if the circular reference will be occured
			async function checkCircle(folderId) {
				// Fetch folder
				const folder2 = await DriveFolder.findOne({
					_id: folderId
				}, {
					_id: true,
					parent_id: true
				});

				if (folder2._id.equals(folder._id)) {
					return true;
				} else if (folder2.parent_id) {
					return await checkCircle(folder2.parent_id);
				} else {
					return false;
				}
			}

			if (parent.parent_id !== null) {
				if (await checkCircle(parent.parent_id)) {
					return rej('detected-circular-definition');
				}
			}

			folder.parent_id = parent._id;
		}
	}

	// Update
	DriveFolder.updateOne({ _id: folder._id }, {
		$set: folder
	});

	// Serialize
	const folderObj = await serialize(folder);

	// Response
	res(folderObj);

	// Publish drive_folder_updated event
	event(user._id, 'drive_folder_updated', folderObj);
});
