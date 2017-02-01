import * as mongodb from 'mongodb';
import * as crypto from 'crypto';
import * as gm from 'gm';
import fileType = require('file-type');
import prominence = require('prominence');
import DriveFile from '../models/drive-file';
import DriveFolder from '../models/drive-folder';
import serialize from '../serializers/drive-file';
import event from '../event';
import config from '../../conf';

/**
 * Add file to drive
 *
 * @param user User who wish to add file
 * @param fileName File name
 * @param data Contents
 * @param comment Comment
 * @param type File type
 * @param folderId Folder ID
 * @param force If set to true, forcibly upload the file even if there is a file with the same hash.
 * @return Object that represents added file
 */
export default (
	user: any,
	data: Buffer,
	name: string = null,
	comment: string = null,
	folderId: mongodb.ObjectID = null,
	force: boolean = false
) => new Promise<any>(async (resolve, reject) => {
	// File size
	const size = data.byteLength;

	// File type
	let mime = 'application/octet-stream';
	const type = fileType(data);
	if (type !== null) {
		mime = type.mime;

		if (name === null) {
			name = `untitled.${type.ext}`;
		}
	} else {
		if (name === null) {
			name = 'untitled';
		}
	}

	// Generate hash
	const hash = crypto
		.createHash('sha256')
		.update(data)
		.digest('hex') as string;

	if (!force) {
		// Check if there is a file with the same hash
		const much = await DriveFile.findOne({
			user_id: user._id,
			hash: hash
		});

		if (much !== null) {
			resolve(much);
			return;
		}
	}

	// Fetch all files to calculate drive usage
	const files = await DriveFile
		.find({ user_id: user._id }, {
			fields: {
				datasize: true,
				_id: false
			}
		});

	// Calculate drive usage (in byte)
	const usage = files.map(file => file.datasize).reduce((x, y) => x + y, 0);

	// If usage limit exceeded
	if (usage + size > user.drive_capacity) {
		return reject('no-free-space');
	}

	// If the folder is specified
	let folder: any = null;
	if (folderId !== null) {
		folder = await DriveFolder
			.findOne({
				_id: folderId,
				user_id: user._id
			});

		if (folder === null) {
			return reject('folder-not-found');
		}
	}

	let properties: any = null;

	// If the file is an image
	if (/^image\/.*$/.test(mime)) {
		// Calculate width and height to save in property
		const g = gm(data, name);
		const size = await prominence(g).size();
		properties = {
			width: size.width,
			height: size.height
		};
	}

	// Create DriveFile document
	const file = await DriveFile.insert({
		created_at: new Date(),
		user_id: user._id,
		folder_id: folder !== null ? folder._id : null,
		data: data,
		datasize: size,
		type: mime,
		name: name,
		comment: comment,
		hash: hash,
		properties: properties
	});

	resolve(file);

	// Serialize
	const fileObj = await serialize(file);

	// Publish drive_file_created event
	event(user._id, 'drive_file_created', fileObj);

	// Register to search database
	if (config.elasticsearch.enable) {
		const es = require('../../db/elasticsearch');
		es.index({
			index: 'misskey',
			type: 'drive_file',
			id: file._id.toString(),
			body: {
				name: file.name,
				user_id: user._id.toString()
			}
		});
	}
});
