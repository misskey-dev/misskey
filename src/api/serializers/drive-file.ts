'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFile from '../models/drive-file';
import serializeDriveFolder from './drive-folder';
import serializeDriveTag from './drive-tag';
import deepcopy = require('deepcopy');
import config from '../../conf';

/**
 * Serialize a drive file
 *
 * @param {any} file
 * @param {any} options?
 * @return {Promise<any>}
 */
export default (
	file: any,
	options?: {
		detail: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false
	}, options);

	let _file: any;

	// Populate the file if 'file' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(file)) {
		_file = await DriveFile.findOne({
			_id: file
		}, {
				fields: {
					data: false
				}
			});
	} else if (typeof file === 'string') {
		_file = await DriveFile.findOne({
			_id: new mongo.ObjectID(file)
		}, {
				fields: {
					data: false
				}
			});
	} else {
		_file = deepcopy(file);
	}

	// Rename _id to id
	_file.id = _file._id;
	delete _file._id;

	delete _file.data;

	_file.url = `${config.drive_url}/${_file.id}/${encodeURIComponent(_file.name)}`;

	if (opts.detail && _file.folder_id) {
		// Populate folder
		_file.folder = await serializeDriveFolder(_file.folder_id, {
			detail: true
		});
	}

	if (opts.detail && _file.tags) {
		// Populate tags
		_file.tags = await _file.tags.map(async (tag: any) =>
			await serializeDriveTag(tag)
		);
	}

	resolve(_file);
});
