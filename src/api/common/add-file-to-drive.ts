import * as mongodb from 'mongodb';
import * as crypto from 'crypto';
import * as gm from 'gm';
import * as debug from 'debug';
import fileType = require('file-type');
import prominence = require('prominence');
import DriveFile, { getGridFSBucket } from '../models/drive-file';
import DriveFolder from '../models/drive-folder';
import serialize from '../serializers/drive-file';
import event from '../event';
import config from '../../conf';
import { Duplex } from 'stream';

const log = debug('misskey:register-drive-file');

const addToGridFS = (name, binary, metadata): Promise<any> => new Promise(async (resolve, reject) => {
	const dataStream = new Duplex()
	dataStream.push(binary)
	dataStream.push(null)

	const bucket = await getGridFSBucket()
	const writeStream = bucket.openUploadStream(name, { metadata })
	writeStream.once('finish', (doc) => { resolve(doc) })
	writeStream.on('error', reject)
	dataStream.pipe(writeStream)
})

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
	log(`registering ${name} (user: ${user.username})`);

	// File size
	const size = data.byteLength;

	log(`size is ${size}`);

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

	log(`type is ${mime}`);

	// Generate hash
	const hash = crypto
		.createHash('md5')
		.update(data)
		.digest('hex') as string;

	log(`hash is ${hash}`);

	if (!force) {
		// Check if there is a file with the same hash
		const much = await DriveFile.findOne({
			md5: hash,
			'metadata.user_id': user._id
		});

		if (much !== null) {
			log('file with same hash is found');
			return resolve(much);
		} else {
			log('file with same hash is not found');
		}
	}

	// Calculate drive usage
	const usage = ((await DriveFile
		.aggregate([
			{ $match: { 'metadata.user_id': user._id } },
			{ $project: {
				length: true
			}},
			{ $group: {
				_id: null,
				usage: { $sum: '$length' }
			}}
		]))[0] || {
			usage: 0
		}).usage;

	log(`drive usage is ${usage}`);

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

		log('image width and height is calculated');
	}

	// Create DriveFile document
	const file = await addToGridFS(`${user._id}/${name}`, data, {
		user_id: user._id,
		folder_id: folder !== null ? folder._id : null,
		type: mime,
		name: name,
		comment: comment,
		properties: properties
	});

	log(`drive file has been created ${file._id}`);

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
