import * as mongo from 'mongodb';
import deepcopy = require('deepcopy');
import db from '../../../db/mongodb';
import DriveFile from './drive-file';

const DriveFolder = db.get<IDriveFolder>('drive_folders');
export default DriveFolder;

export type IDriveFolder = {
	_id: mongo.ObjectID;
	created_at: Date;
	name: string;
	user_id: mongo.ObjectID;
	parent_id: mongo.ObjectID;
};

export function isValidFolderName(name: string): boolean {
	return (
		(name.trim().length > 0) &&
		(name.length <= 200)
	);
}

/**
 * Pack a drive folder for API response
 *
 * @param {any} folder
 * @param {any} options?
 * @return {Promise<any>}
 */
export const pack = (
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
		_folder.parent = await pack(_folder.parent_id, {
			detail: true
		});
	}

	resolve(_folder);
});
