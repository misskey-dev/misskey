import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as tmp from 'tmp';
import * as stream from 'stream';

import * as mongodb from 'mongodb';
import * as crypto from 'crypto';
import * as _gm from 'gm';
import * as debug from 'debug';
import fileType = require('file-type');
import prominence = require('prominence');

import DriveFile, { IMetadata, getGridFSBucket } from '../models/drive-file';
import DriveFolder from '../models/drive-folder';
import { pack } from '../models/drive-file';
import event, { publishDriveStream } from '../publishers/stream';
import getAcct from '../acct/render';
import config from '../config';

const gm = _gm.subClass({
	imageMagick: true
});

const log = debug('misskey:drive:add-file');

const tmpFile = (): Promise<string> => new Promise((resolve, reject) => {
	tmp.file((e, path) => {
		if (e) return reject(e);
		resolve(path);
	});
});

const addToGridFS = (name: string, readable: stream.Readable, type: string, metadata: any): Promise<any> =>
	getGridFSBucket()
		.then(bucket => new Promise((resolve, reject) => {
			const writeStream = bucket.openUploadStream(name, { contentType: type, metadata });
			writeStream.once('finish', (doc) => { resolve(doc); });
			writeStream.on('error', reject);
			readable.pipe(writeStream);
		}));

const addFile = async (
	user: any,
	path: string,
	name: string = null,
	comment: string = null,
	folderId: mongodb.ObjectID = null,
	force: boolean = false,
	uri: string = null
) => {
	log(`registering ${name} (user: ${getAcct(user)}, path: ${path})`);

	// Calculate hash, get content type and get file size
	const [hash, [mime, ext], size] = await Promise.all([
		// hash
		((): Promise<string> => new Promise((res, rej) => {
			const readable = fs.createReadStream(path);
			const hash = crypto.createHash('md5');
			const chunks = [];
			readable
				.on('error', rej)
				.pipe(hash)
				.on('error', rej)
				.on('data', (chunk) => chunks.push(chunk))
				.on('end', () => {
					const buffer = Buffer.concat(chunks);
					res(buffer.toString('hex'));
				});
		}))(),
		// mime
		((): Promise<[string, string | null]> => new Promise((res, rej) => {
			const readable = fs.createReadStream(path);
			readable
				.on('error', rej)
				.once('data', (buffer: Buffer) => {
					readable.destroy();
					const type = fileType(buffer);
					if (type) {
						return res([type.mime, type.ext]);
					} else {
						// 種類が同定できなかったら application/octet-stream にする
						return res(['application/octet-stream', null]);
					}
				});
		}))(),
		// size
		((): Promise<number> => new Promise((res, rej) => {
			fs.stat(path, (err, stats) => {
				if (err) return rej(err);
				res(stats.size);
			});
		}))()
	]);

	log(`hash: ${hash}, mime: ${mime}, ext: ${ext}, size: ${size}`);

	// detect name
	const detectedName: string = name || (ext ? `untitled.${ext}` : 'untitled');

	if (!force) {
		// Check if there is a file with the same hash
		const much = await DriveFile.findOne({
			md5: hash,
			'metadata.userId': user._id
		});

		if (much !== null) {
			log('file with same hash is found');
			return much;
		} else {
			log('file with same hash is not found');
		}
	}

	const [wh, averageColor, folder] = await Promise.all([
		// Width and height (when image)
		(async () => {
			// 画像かどうか
			if (!/^image\/.*$/.test(mime)) {
				return null;
			}

			const imageType = mime.split('/')[1];

			// 画像でもPNGかJPEGかGIFでないならスキップ
			if (imageType != 'png' && imageType != 'jpeg' && imageType != 'gif') {
				return null;
			}

			log('calculate image width and height...');

			// Calculate width and height
			const g = gm(fs.createReadStream(path), name);
			const size = await prominence(g).size();

			log(`image width and height is calculated: ${size.width}, ${size.height}`);

			return [size.width, size.height];
		})(),
		// average color (when image)
		(async () => {
			// 画像かどうか
			if (!/^image\/.*$/.test(mime)) {
				return null;
			}

			const imageType = mime.split('/')[1];

			// 画像でもPNGかJPEGでないならスキップ
			if (imageType != 'png' && imageType != 'jpeg') {
				return null;
			}

			log('calculate average color...');

			const buffer = await prominence(gm(fs.createReadStream(path), name)
				.setFormat('ppm')
				.resize(1, 1)) // 1pxのサイズに縮小して平均色を取得するというハック
				.toBuffer();

			const r = buffer.readUInt8(buffer.length - 3);
			const g = buffer.readUInt8(buffer.length - 2);
			const b = buffer.readUInt8(buffer.length - 1);

			log(`average color is calculated: ${r}, ${g}, ${b}`);

			return [r, g, b];
		})(),
		// folder
		(async () => {
			if (!folderId) {
				return null;
			}
			const driveFolder = await DriveFolder.findOne({
				_id: folderId,
				userId: user._id
			});
			if (!driveFolder) {
				throw 'folder-not-found';
			}
			return driveFolder;
		})(),
		// usage checker
		(async () => {
			// Calculate drive usage
			const usage = await DriveFile
				.aggregate([{
					$match: { 'metadata.userId': user._id }
				}, {
					$project: {
						length: true
					}
				}, {
					$group: {
						_id: null,
						usage: { $sum: '$length' }
					}
				}])
				.then((aggregates: any[]) => {
					if (aggregates.length > 0) {
						return aggregates[0].usage;
					}
					return 0;
				});

			log(`drive usage is ${usage}`);

			// If usage limit exceeded
			if (usage + size > user.driveCapacity) {
				throw 'no-free-space';
			}
		})()
	]);

	const readable = fs.createReadStream(path);

	const properties = {};

	if (wh) {
		properties['width'] = wh[0];
		properties['height'] = wh[1];
	}

	if (averageColor) {
		properties['avgColor'] = averageColor;
	}

	const metadata = {
		userId: user._id,
		folderId: folder !== null ? folder._id : null,
		comment: comment,
		properties: properties
	} as IMetadata;

	if (uri !== null) {
		metadata.uri = uri;
	}

	return addToGridFS(detectedName, readable, mime, metadata);
};

/**
 * Add file to drive
 *
 * @param user User who wish to add file
 * @param file File path or readableStream
 * @param comment Comment
 * @param type File type
 * @param folderId Folder ID
 * @param force If set to true, forcibly upload the file even if there is a file with the same hash.
 * @return Object that represents added file
 */
export default (user: any, file: string | stream.Readable, ...args) => new Promise<any>((resolve, reject) => {
	// Get file path
	new Promise((res: (v: [string, boolean]) => void, rej) => {
		if (typeof file === 'string') {
			res([file, false]);
			return;
		}
		if (typeof file === 'object' && typeof file.read === 'function') {
			tmpFile()
				.then(path => {
					const readable: stream.Readable = file;
					const writable = fs.createWriteStream(path);
					readable
						.on('error', rej)
						.on('end', () => {
							res([path, true]);
						})
						.pipe(writable)
						.on('error', rej);
				})
				.catch(rej);
		}
		rej(new Error('un-compatible file.'));
	})
	.then(([path, shouldCleanup]): Promise<any> => new Promise((res, rej) => {
		addFile(user, path, ...args)
			.then(file => {
				res(file);
				if (shouldCleanup) {
					fs.unlink(path, (e) => {
						if (e) log(e.stack);
					});
				}
			})
			.catch(rej);
	}))
	.then(file => {
		log(`drive file has been created ${file._id}`);
		resolve(file);

		pack(file).then(serializedFile => {
			// Publish drive_file_created event
			event(user._id, 'drive_file_created', serializedFile);
			publishDriveStream(user._id, 'file_created', serializedFile);

			// Register to search database
			if (config.elasticsearch.enable) {
				const es = require('../db/elasticsearch');
				es.index({
					index: 'misskey',
					type: 'drive_file',
					id: file._id.toString(),
					body: {
						name: file.name,
						userId: user._id.toString()
					}
				});
			}
		});
	})
	.catch(reject);
});
