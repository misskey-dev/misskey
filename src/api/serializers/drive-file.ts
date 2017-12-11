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
		});
	} else if (typeof file === 'string') {
		_file = await DriveFile.findOne({
			_id: new mongo.ObjectID(file)
		});
	} else {
		_file = deepcopy(file);
	}

	if (!_file) return reject('invalid file arg.');

	// rendered target
	let _target: any = {};

	_target.id = _file._id;
	_target.created_at = _file.uploadDate;
	_target.name = _file.filename;
	_target.type = _file.contentType;
	_target.datasize = _file.length;
	_target.md5 = _file.md5;

	_target = Object.assign(_target, _file.metadata);

	_target.url = `${config.drive_url}/${_target.id}/${encodeURIComponent(_target.name)}`;

	if (_target.properties == null) _target.properties = {};

	if (opts.detail) {
		if (_target.folder_id) {
			// Populate folder
			_target.folder = await serializeDriveFolder(_target.folder_id, {
				detail: true
			});
		}

		if (_target.tags) {
			// Populate tags
			_target.tags = await _target.tags.map(async (tag: any) =>
				await serializeDriveTag(tag)
			);
		}
	}

	resolve(_target);
});
