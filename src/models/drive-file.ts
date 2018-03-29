import * as mongodb from 'mongodb';
import deepcopy = require('deepcopy');
import { pack as packFolder } from './drive-folder';
import config from '../conf';
import monkDb, { nativeDbConn } from '../db/mongodb';

const DriveFile = monkDb.get<IDriveFile>('driveFiles.files');

export default DriveFile;

const getGridFSBucket = async (): Promise<mongodb.GridFSBucket> => {
	const db = await nativeDbConn();
	const bucket = new mongodb.GridFSBucket(db, {
		bucketName: 'driveFiles'
	});
	return bucket;
};

export { getGridFSBucket };

export type IDriveFile = {
	_id: mongodb.ObjectID;
	uploadDate: Date;
	md5: string;
	filename: string;
	contentType: string;
	metadata: {
		properties: any;
		userId: mongodb.ObjectID;
		folderId: mongodb.ObjectID;
	}
};

export function validateFileName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200) &&
		(name.indexOf('\\') === -1) &&
		(name.indexOf('/') === -1) &&
		(name.indexOf('..') === -1)
	);
}

/**
 * Pack a drive file for API response
 *
 * @param {any} file
 * @param {any} options?
 * @return {Promise<any>}
 */
export const pack = (
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
	if (mongodb.ObjectID.prototype.isPrototypeOf(file)) {
		_file = await DriveFile.findOne({
			_id: file
		});
	} else if (typeof file === 'string') {
		_file = await DriveFile.findOne({
			_id: new mongodb.ObjectID(file)
		});
	} else {
		_file = deepcopy(file);
	}

	if (!_file) return reject('invalid file arg.');

	// rendered target
	let _target: any = {};

	_target.id = _file._id;
	_target.createdAt = _file.uploadDate;
	_target.name = _file.filename;
	_target.type = _file.contentType;
	_target.datasize = _file.length;
	_target.md5 = _file.md5;

	_target = Object.assign(_target, _file.metadata);

	_target.url = `${config.drive_url}/${_target.id}/${encodeURIComponent(_target.name)}`;

	if (_target.properties == null) _target.properties = {};

	if (opts.detail) {
		if (_target.folderId) {
			// Populate folder
			_target.folder = await packFolder(_target.folderId, {
				detail: true
			});
		}

		/*
		if (_target.tags) {
			// Populate tags
			_target.tags = await _target.tags.map(async (tag: any) =>
				await serializeDriveTag(tag)
			);
		}
		*/
	}

	resolve(_target);
});
