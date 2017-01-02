'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFolder from '../models/drive-folder';
import deepcopy = require('deepcopy');

/**
 * Serialize a drive folder
 *
 * @param {Object} folder
 * @param {Object} options?
 * @return {Promise<Object>}
 */
const self = (
	folder: any,
	options?: {
		includeParent: boolean
	}
) => new Promise<Object>(async (resolve, reject) => {
	const opts = options || {
		includeParent: false
	};

	let _folder: any;

	// Populate the folder if 'folder' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(folder)) {
		_folder = await DriveFolder.findOne({_id: folder});
	} else if (typeof folder === 'string') {
		_folder = await DriveFolder.findOne({_id: new mongo.ObjectID(folder)});
	} else {
		_folder = deepcopy(folder);
	}

	// Rename _id to id
	_folder.id = _folder._id;
	delete _folder._id;

	if (opts.includeParent && _folder.parent_id) {
		// Populate parent folder
		_folder.parent = await self(_folder.parent_id, {
			includeParent: true
		});
	}

	resolve(_folder);
});

export default self;
