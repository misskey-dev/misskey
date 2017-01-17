'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFile from '../models/drive-file';
import serializeDriveTag from './drive-tag';
import deepcopy = require('deepcopy');
import config from '../../conf';

/**
 * Serialize a drive file
 *
 * @param {Object} file
 * @param {Object} options?
 * @return {Promise<Object>}
 */
export default (
	file: any,
	options?: {
		includeTags: boolean
	}
) => new Promise<Object>(async (resolve, reject) => {
	const opts = options || {
		includeTags: true
	};

	let _file: any;

	// Populate the file if 'file' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(file)) {
		_file = await DriveFile.findOne({
			_id: file
		}, {
			data: false
		});
	} else if (typeof file === 'string') {
		_file = await DriveFile.findOne({
			_id: new mongo.ObjectID(file)
		}, {
			data: false
		});
	} else {
		_file = deepcopy(file);
	}

	// Rename _id to id
	_file.id = _file._id;
	delete _file._id;

	delete _file.data;

	_file.url = `${config.drive_url}/${_file.id}/${encodeURIComponent(_file.name)}`;

	if (opts.includeTags && _file.tags) {
		// Populate tags
		_file.tags = await _file.tags.map(async (tag: any) =>
			await serializeDriveTag(tag)
		);
	}

	resolve(_file);
});
