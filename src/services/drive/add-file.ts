import { Buffer } from 'buffer';
import * as fs from 'fs';
import * as stream from 'stream';

import * as mongodb from 'mongodb';
import * as crypto from 'crypto';
import * as _gm from 'gm';
import * as debug from 'debug';
import fileType = require('file-type');
import prominence = require('prominence');

import DriveFile, { IMetadata, getDriveFileBucket, IDriveFile, DriveFileChunk } from '../../models/drive-file';
import DriveFolder from '../../models/drive-folder';
import { pack } from '../../models/drive-file';
import event, { publishDriveStream } from '../../publishers/stream';
import { isLocalUser, IUser, IRemoteUser } from '../../models/user';
import DriveFileThumbnail, { getDriveFileThumbnailBucket, DriveFileThumbnailChunk } from '../../models/drive-file-thumbnail';
import genThumbnail from '../../drive/gen-thumbnail';

const gm = _gm.subClass({
	imageMagick: true
});

const log = debug('misskey:drive:add-file');

const writeChunks = (name: string, readable: stream.Readable, type: string, metadata: any) =>
	getDriveFileBucket()
		.then(bucket => new Promise((resolve, reject) => {
			const writeStream = bucket.openUploadStream(name, { contentType: type, metadata });
			writeStream.once('finish', resolve);
			writeStream.on('error', reject);
			readable.pipe(writeStream);
		}));

const writeThumbnailChunks = (name: string, readable: stream.Readable, originalId) =>
	getDriveFileThumbnailBucket()
		.then(bucket => new Promise((resolve, reject) => {
			const writeStream = bucket.openUploadStream(name, {
				contentType: 'image/jpeg',
				metadata: {
					originalId
				}
			});
			writeStream.once('finish', resolve);
			writeStream.on('error', reject);
			readable.pipe(writeStream);
		}));

async function deleteOldFile(user: IRemoteUser) {
	const oldFile = await DriveFile.findOne({
		_id: {
			$nin: [user.avatarId, user.bannerId]
		}
	}, {
		sort: {
			_id: 1
		}
	});

	if (oldFile) {
		// チャンクをすべて削除
		DriveFileChunk.remove({
			files_id: oldFile._id
		});

		DriveFile.update({ _id: oldFile._id }, {
			$set: {
				'metadata.deletedAt': new Date(),
				'metadata.isExpired': true
			}
		});

		//#region サムネイルもあれば削除
		const thumbnail = await DriveFileThumbnail.findOne({
			'metadata.originalId': oldFile._id
		});

		if (thumbnail) {
			DriveFileThumbnailChunk.remove({
				files_id: thumbnail._id
			});

			DriveFileThumbnail.remove({ _id: thumbnail._id });
		}
		//#endregion
	}
}

/**
 * Add file to drive
 *
 * @param user User who wish to add file
 * @param path File path
 * @param name Name
 * @param comment Comment
 * @param folderId Folder ID
 * @param force If set to true, forcibly upload the file even if there is a file with the same hash.
 * @return Created drive file
 */
export default async function(
	user: IUser,
	path: string,
	name: string = null,
	comment: string = null,
	folderId: mongodb.ObjectID = null,
	force: boolean = false,
	metaOnly: boolean = false,
	url: string = null,
	uri: string = null
): Promise<IDriveFile> {
	// Calc md5 hash
	const calcHash = new Promise<string>((res, rej) => {
		const readable = fs.createReadStream(path);
		const hash = crypto.createHash('md5');
		const chunks = [];
		readable
			.on('error', rej)
			.pipe(hash)
			.on('error', rej)
			.on('data', chunk => chunks.push(chunk))
			.on('end', () => {
				const buffer = Buffer.concat(chunks);
				res(buffer.toString('hex'));
			});
	});

	// Detect content type
	const detectMime = new Promise<[string, string]>((res, rej) => {
		const readable = fs.createReadStream(path);
		readable
			.on('error', rej)
			.once('data', (buffer: Buffer) => {
				readable.destroy();
				const type = fileType(buffer);
				if (type) {
					res([type.mime, type.ext]);
				} else {
					// 種類が同定できなかったら application/octet-stream にする
					res(['application/octet-stream', null]);
				}
			});
	});

	// Get file size
	const getFileSize = new Promise<number>((res, rej) => {
		fs.stat(path, (err, stats) => {
			if (err) return rej(err);
			res(stats.size);
		});
	});

	const [hash, [mime, ext], size] = await Promise.all([calcHash, detectMime, getFileSize]);

	log(`hash: ${hash}, mime: ${mime}, ext: ${ext}, size: ${size}`);

	// detect name
	const detectedName = name || (ext ? `untitled.${ext}` : 'untitled');

	if (!force) {
		// Check if there is a file with the same hash
		const much = await DriveFile.findOne({
			md5: hash,
			'metadata.userId': user._id,
			'metadata.deletedAt': { $exists: false }
		});

		if (much) {
			log(`file with same hash is found: ${much._id}`);
			return much;
		}
	}

	//#region Check drive usage
	if (!metaOnly) {
		const usage = await DriveFile
			.aggregate([{
				$match: {
					'metadata.userId': user._id,
					'metadata.deletedAt': { $exists: false }
				}
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
			if (isLocalUser(user)) {
				throw 'no-free-space';
			} else {
				// (アバターまたはバナーを含まず)最も古いファイルを削除する
				deleteOldFile(user);
			}
		}
	}
	//#endregion

	const fetchFolder = async () => {
		if (!folderId) {
			return null;
		}

		const driveFolder = await DriveFolder.findOne({
			_id: folderId,
			userId: user._id
		});

		if (driveFolder == null) throw 'folder-not-found';

		return driveFolder;
	};

	const properties = {};

	let propPromises: Array<Promise<void>> = [];

	const isImage = ['image/jpeg', 'image/gif', 'image/png'].includes(mime);

	if (isImage) {
		// Calc width and height
		const calcWh = async () => {
			log('calculate image width and height...');

			// Calculate width and height
			const g = gm(fs.createReadStream(path), name);
			const size = await prominence(g).size();

			log(`image width and height is calculated: ${size.width}, ${size.height}`);

			properties['width'] = size.width;
			properties['height'] = size.height;
		};

		// Calc average color
		const calcAvg = async () => {
			log('calculate average color...');

			const info = await prominence(gm(fs.createReadStream(path), name)).identify();
			const isTransparent = info ? info['Channel depth'].Alpha != null : false;

			const buffer = await prominence(gm(fs.createReadStream(path), name)
				.setFormat('ppm')
				.resize(1, 1)) // 1pxのサイズに縮小して平均色を取得するというハック
				.toBuffer();

			const r = buffer.readUInt8(buffer.length - 3);
			const g = buffer.readUInt8(buffer.length - 2);
			const b = buffer.readUInt8(buffer.length - 1);

			log(`average color is calculated: ${r}, ${g}, ${b}`);

			const value = isTransparent ? [r, g, b, 255] : [r, g, b];

			properties['avgColor'] = value;
		};

		propPromises = [calcWh(), calcAvg()];
	}

	const [folder] = await Promise.all([fetchFolder(), Promise.all(propPromises)]);

	const metadata = {
		userId: user._id,
		_user: {
			host: user.host
		},
		folderId: folder !== null ? folder._id : null,
		comment: comment,
		properties: properties,
		isMetaOnly: metaOnly
	} as IMetadata;

	if (url !== null) {
		metadata.url = url;
	}

	if (uri !== null) {
		metadata.uri = uri;
	}

	const driveFile = metaOnly
		? await DriveFile.insert({
			length: 0,
			uploadDate: new Date(),
			md5: hash,
			filename: detectedName,
			metadata: metadata,
			contentType: mime
		})
		: await (writeChunks(detectedName, fs.createReadStream(path), mime, metadata) as Promise<IDriveFile>);

	log(`drive file has been created ${driveFile._id}`);

	pack(driveFile).then(packedFile => {
		// Publish drive_file_created event
		event(user._id, 'drive_file_created', packedFile);
		publishDriveStream(user._id, 'file_created', packedFile);
	});

	if (!metaOnly) {
		try {
			const thumb = await genThumbnail(driveFile);
			if (thumb) {
				await writeThumbnailChunks(detectedName, thumb, driveFile._id);
			}
		} catch (e) {
			// noop
		}
	}

	return driveFile;
}
