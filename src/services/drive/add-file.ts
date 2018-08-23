import { Buffer } from 'buffer';
import * as fs from 'fs';

import * as mongodb from 'mongodb';
import * as crypto from 'crypto';
import * as debug from 'debug';
import fileType = require('file-type');
import * as Minio from 'minio';
import * as uuid from 'uuid';
import * as sharp from 'sharp';

import DriveFile, { IMetadata, getDriveFileBucket, IDriveFile } from '../../models/drive-file';
import DriveFolder from '../../models/drive-folder';
import { pack } from '../../models/drive-file';
import { publishUserStream, publishDriveStream } from '../../stream';
import { isLocalUser, IUser, IRemoteUser } from '../../models/user';
import delFile from './delete-file';
import config from '../../config';
import { getDriveFileThumbnailBucket } from '../../models/drive-file-thumbnail';
import { updateDriveStats } from '../update-chart';

const log = debug('misskey:drive:add-file');

async function save(path: string, name: string, type: string, hash: string, size: number, metadata: any): Promise<IDriveFile> {
	let thumbnail: Buffer;

	if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
		thumbnail = await sharp(path)
			.resize(300)
			.jpeg({
				quality: 50,
				progressive: true
			})
			.toBuffer();
	}

	if (config.drive && config.drive.storage == 'minio') {
		const minio = new Minio.Client(config.drive.config);
		const key = `${config.drive.prefix}/${uuid.v4()}/${name}`;
		const thumbnailKey = `${config.drive.prefix}/${uuid.v4()}/${name}.thumbnail.jpg`;

		const baseUrl = config.drive.baseUrl
			|| `${ config.drive.config.useSSL ? 'https' : 'http' }://${ config.drive.config.endPoint }${ config.drive.config.port ? ':' + config.drive.config.port : '' }/${ config.drive.bucket }`;

		await minio.putObject(config.drive.bucket, key, fs.createReadStream(path), size, {
			'Content-Type': type,
			'Cache-Control': 'max-age=31536000, immutable'
		});

		if (thumbnail) {
			await minio.putObject(config.drive.bucket, thumbnailKey, thumbnail, size, {
				'Content-Type': 'image/jpeg',
				'Cache-Control': 'max-age=31536000, immutable'
			});
		}

		Object.assign(metadata, {
			withoutChunks: true,
			storage: 'minio',
			storageProps: {
				key: key,
				thumbnailKey: thumbnailKey
			},
			url: `${ baseUrl }/${ key }`,
			thumbnailUrl: thumbnail ? `${ baseUrl }/${ thumbnailKey }` : null
		});

		const file = await DriveFile.insert({
			length: size,
			uploadDate: new Date(),
			md5: hash,
			filename: name,
			metadata: metadata,
			contentType: type
		});

		return file;
	} else {
		// Get MongoDB GridFS bucket
		const bucket = await getDriveFileBucket();

		const file = await new Promise<IDriveFile>((resolve, reject) => {
			const writeStream = bucket.openUploadStream(name, {
				contentType: type,
				metadata
			});

			writeStream.once('finish', resolve);
			writeStream.on('error', reject);

			fs.createReadStream(path).pipe(writeStream);
		});

		if (thumbnail) {
			const thumbnailBucket = await getDriveFileThumbnailBucket();

			await new Promise<IDriveFile>((resolve, reject) => {
				const writeStream = thumbnailBucket.openUploadStream(name, {
					contentType: 'image/jpeg',
					metadata: {
						originalId: file._id
					}
				});

				writeStream.once('finish', resolve);
				writeStream.on('error', reject);
				writeStream.end(thumbnail);
			});
		}

		return file;
	}
}

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
		delFile(oldFile, true);
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
	isLink: boolean = false,
	url: string = null,
	uri: string = null,
	sensitive = false
): Promise<IDriveFile> {
	// Calc md5 hash
	const calcHash = new Promise<string>((res, rej) => {
		const readable = fs.createReadStream(path);
		const hash = crypto.createHash('md5');
		const chunks: Buffer[] = [];
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
	if (!isLink) {
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

		const driveCapacity = 1024 * 1024 * (isLocalUser(user) ? config.localDriveCapacityMb : config.remoteDriveCapacityMb);

		// If usage limit exceeded
		if (usage + size > driveCapacity) {
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

	const properties: {[key: string]: any} = {};

	let propPromises: Array<Promise<void>> = [];

	const isImage = ['image/jpeg', 'image/gif', 'image/png', 'image/webp'].includes(mime);

	if (isImage) {
		const img = sharp(path);

		// Calc width and height
		const calcWh = async () => {
			log('calculate image width and height...');

			// Calculate width and height
			const meta = await img.metadata();

			log(`image width and height is calculated: ${meta.width}, ${meta.height}`);

			properties['width'] = meta.width;
			properties['height'] = meta.height;
		};

		// Calc average color
		const calcAvg = async () => {
			log('calculate average color...');

			try {
				const info = await (img as any).stats();

				const r = Math.round(info.channels[0].mean);
				const g = Math.round(info.channels[1].mean);
				const b = Math.round(info.channels[2].mean);

				log(`average color is calculated: ${r}, ${g}, ${b}`);

				const value = info.isOpaque ? [r, g, b] : [r, g, b, 255];

				properties['avgColor'] = value;
			} catch (e) { }
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
		withoutChunks: isLink,
		isRemote: isLink,
		isSensitive: sensitive
	} as IMetadata;

	if (url !== null) {
		metadata.src = url;

		if (isLink) {
			metadata.url = url;
		}
	}

	if (uri !== null) {
		metadata.uri = uri;
	}

	let driveFile: IDriveFile;

	if (isLink) {
		try {
			driveFile = await DriveFile.insert({
				length: 0,
				uploadDate: new Date(),
				md5: hash,
				filename: detectedName,
				metadata: metadata,
				contentType: mime
			});
		} catch (e) {
			// duplicate key error (when already registered)
			if (e.code === 11000) {
				log(`already registered ${metadata.uri}`);

				driveFile = await DriveFile.findOne({
					'metadata.uri': metadata.uri,
					'metadata.userId': user._id
				});
			} else {
				console.error(e);
				throw e;
			}
		}
	} else {
		driveFile = await (save(path, detectedName, mime, hash, size, metadata));
	}

	log(`drive file has been created ${driveFile._id}`);

	pack(driveFile).then(packedFile => {
		// Publish drive_file_created event
		publishUserStream(user._id, 'drive_file_created', packedFile);
		publishDriveStream(user._id, 'file_created', packedFile);
	});

	// 統計を更新
	updateDriveStats(driveFile, true);

	return driveFile;
}
