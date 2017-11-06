/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFolder from '../models/drive-folder';
import DriveFile from '../models/drive-file';
import deepcopy = require('deepcopy');

/**
 * Serialize a drive folder
 *
 * @param {any} folder
 * @param {any} options?
 * @return {Promise<any>}
 */
const self = (
	folder: any,
	options?: {
		detail: boolean
	}
) => new Promise<any>(async (resolve, reject) => {
	const opts = Object.assign({
		detail: false
	}, options);

	let _folder: any;

	// Populate the folder if 'folder' is ID
	if (mongo.ObjectID.prototype.isPrototypeOf(folder)) {
		_folder = await DriveFolder.findOne({ _id: folder });
	} else if (typeof folder === 'string') {
		_folder = await DriveFolder.findOne({ _id: new mongo.ObjectID(folder) });
	} else {
		_folder = deepcopy(folder);
	}

	// Rename _id to id
	_folder.id = _folder._id;
	delete _folder._id;

	if (opts.detail) {
		const childFoldersCount = await DriveFolder.count({
			parent_id: _folder.id
		});

		const childFilesCount = await DriveFile.count({
			'metadata.folder_id': _folder.id
		});

		_folder.folders_count = childFoldersCount;
		_folder.files_count = childFilesCount;
	}

	if (opts.detail && _folder.parent_id) {
		// Populate parent folder
		_folder.parent = await self(_folder.parent_id, {
			detail: true
		});
	}

	resolve(_folder);
});

export default self;
