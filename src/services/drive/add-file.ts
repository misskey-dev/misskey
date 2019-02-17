import { Buffer } from 'buffer';
import * as fs from 'fs';

import * as mongodb from 'mongodb';
import * as crypto from 'crypto';
import * as Minio from 'minio';
import * as uuid from 'uuid';
import * as sharp from 'sharp';
import * as fileType from 'file-type';
import * as isSvg from 'is-svg';

import DriveFile, { IMetadata, getDriveFileBucket, IDriveFile } from '../../models/drive-file';
import DriveFolder from '../../models/drive-folder';
import { pack } from '../../models/drive-file';
import { publishMainStream, publishDriveStream } from '../stream';
import { isLocalUser, IUser, IRemoteUser, isRemoteUser } from '../../models/user';
import delFile from './delete-file';
import config from '../../config';
import { getDriveFileWebpublicBucket } from '../../models/drive-file-webpublic';
import { getDriveFileThumbnailBucket } from '../../models/drive-file-thumbnail';
import driveChart from '../../services/chart/drive';
import perUserDriveChart from '../../services/chart/per-user-drive';
import instanceChart from '../../services/chart/instance';
import fetchMeta from '../../misc/fetch-meta';
import { GenerateVideoThumbnail } from './generate-video-thumbnail';
import { driveLogger } from './logger';
import { IImage, ConvertToJpeg, ConvertToWebp, ConvertToPng } from './image-processor';
import Instance from '../../models/instance';

const logger = driveLogger.createSubLogger('register', 'yellow');

/***
 * Save file
 * @param path Path for original
 * @param name Name for original
 * @param type Content-Type for original
 * @param hash Hash for original
 * @param size Size for original
 * @param metadata
 */
async function save(path: string, name: string, type: string, hash: string, size: number, metadata: IMetadata): Promise<IDriveFile> {
	// thunbnail, webpublic を必要なら生成
	const alts = await generateAlts(path, type, !metadata.uri);

	if (config.drive && config.drive.storage == 'minio') {
		//#region ObjectStorage params
		let [ext] = (name.match(/\.([a-zA-Z0-9_-]+)$/) || ['']);

		if (ext === '') {
			if (type === 'image/jpeg') ext = '.jpg';
			if (type === 'image/png') ext = '.png';
			if (type === 'image/webp') ext = '.webp';
		}

		const baseUrl = config.drive.baseUrl
			|| `${ config.drive.config.useSSL ? 'https' : 'http' }://${ config.drive.config.endPoint }${ config.drive.config.port ? `:${config.drive.config.port}` : '' }/${ config.drive.bucket }`;

		// for original
		const key = `${config.drive.prefix}/${uuid.v4()}${ext}`;
		const url = `${ baseUrl }/${ key }`;

		// for alts
		let webpublicKey = null as string;
		let webpublicUrl = null as string;
		let thumbnailKey = null as string;
		let thumbnailUrl = null as string;
		//#endregion

		//#region Uploads
		logger.info(`uploading original: ${key}`);
		const uploads = [
			upload(key, fs.createReadStream(path), type)
		];

		if (alts.webpublic) {
			webpublicKey = `${config.drive.prefix}/${uuid.v4()}.${alts.webpublic.ext}`;
			webpublicUrl = `${ baseUrl }/${ webpublicKey }`;

			logger.info(`uploading webpublic: ${webpublicKey}`);
			uploads.push(upload(webpublicKey, alts.webpublic.data, alts.webpublic.type));
		}

		if (alts.thumbnail) {
			thumbnailKey = `${config.drive.prefix}/${uuid.v4()}.${alts.thumbnail.ext}`;
			thumbnailUrl = `${ baseUrl }/${ thumbnailKey }`;

			logger.info(`uploading thumbnail: ${thumbnailKey}`);
			uploads.push(upload(thumbnailKey, alts.thumbnail.data, alts.thumbnail.type));
		}

		await Promise.all(uploads);
		//#endregion

		//#region DB
		Object.assign(metadata, {
			withoutChunks: true,
			storage: 'minio',
			storageProps: {
				key,
				webpublicKey,
				thumbnailKey,
			},
			url,
			webpublicUrl,
			thumbnailUrl,
		} as IMetadata);

		const file = await DriveFile.insert({
			length: size,
			uploadDate: new Date(),
			md5: hash,
			filename: name,
			metadata: metadata,
			contentType: type
		});
		//#endregion

		return file;
	} else {	// use MongoDB GridFS
		// #region store original
		const originalDst = await getDriveFileBucket();

		// web用(Exif削除済み)がある場合はオリジナルにアクセス制限
		if (alts.webpublic) metadata.accessKey = uuid.v4();

		const originalFile = await storeOriginal(originalDst, name, path, type, metadata);

		logger.info(`original stored to ${originalFile._id}`);
		// #endregion store original

		// #region store webpublic
		if (alts.webpublic) {
			const webDst = await getDriveFileWebpublicBucket();
			const webFile = await storeAlts(webDst, name, alts.webpublic.data, alts.webpublic.type, originalFile._id);
			logger.info(`web stored ${webFile._id}`);
		}
		// #endregion store webpublic

		if (alts.thumbnail) {
			const thumDst = await getDriveFileThumbnailBucket();
			const thumFile = await storeAlts(thumDst, name, alts.thumbnail.data, alts.thumbnail.type, originalFile._id);
			logger.info(`web stored ${thumFile._id}`);
		}

		return originalFile;
	}
}

/**
 * Generate webpublic, thumbnail, etc
 * @param path Path for original
 * @param type Content-Type for original
 * @param generateWeb Generate webpublic or not
 */
export async function generateAlts(path: string, type: string, generateWeb: boolean) {
	// #region webpublic
	let webpublic: IImage;

	if (generateWeb) {
		logger.info(`creating web image`);

		if (['image/jpeg'].includes(type)) {
			webpublic = await ConvertToJpeg(path, 2048, 2048);
		} else if (['image/webp'].includes(type)) {
			webpublic = await ConvertToWebp(path, 2048, 2048);
		} else if (['image/png'].includes(type)) {
			webpublic = await ConvertToPng(path, 2048, 2048);
		} else {
			logger.info(`web image not created (not an image)`);
		}
	} else {
		logger.info(`web image not created (from remote)`);
	}
	// #endregion webpublic

	// #region thumbnail
	let thumbnail: IImage;

	if (['image/jpeg', 'image/webp'].includes(type)) {
		thumbnail = await ConvertToJpeg(path, 498, 280);
	} else if (['image/png'].includes(type)) {
		thumbnail = await ConvertToPng(path, 498, 280);
	} else if (type.startsWith('video/')) {
		try {
			thumbnail = await GenerateVideoThumbnail(path);
		} catch (e) {
			logger.error(`GenerateVideoThumbnail failed: ${e}`);
		}
	}
	// #endregion thumbnail

	return {
		webpublic,
		thumbnail,
	};
}

/**
 * Upload to ObjectStorage
 */
async function upload(key: string, stream: fs.ReadStream | Buffer, type: string) {
	const minio = new Minio.Client(config.drive.config);

	await minio.putObject(config.drive.bucket, key, stream, null, {
		'Content-Type': type,
		'Cache-Control': 'max-age=31536000, immutable'
	});
}

/**
 * GridFSBucketにオリジナルを格納する
 */
export async function storeOriginal(bucket: mongodb.GridFSBucket, name: string, path: string, contentType: string, metadata: any) {
	return new Promise<IDriveFile>((resolve, reject) => {
		const writeStream = bucket.openUploadStream(name, {
			contentType,
			metadata
		});

		writeStream.once('finish', resolve);
		writeStream.on('error', reject);
		fs.createReadStream(path).pipe(writeStream);
	});
}

/**
 * GridFSBucketにオリジナル以外を格納する
 */
export async function storeAlts(bucket: mongodb.GridFSBucket, name: string, data: Buffer, contentType: string, originalId: mongodb.ObjectID) {
	return new Promise<IDriveFile>((resolve, reject) => {
		const writeStream = bucket.openUploadStream(name, {
			contentType,
			metadata: {
				originalId
			}
		});

		writeStream.once('finish', resolve);
		writeStream.on('error', reject);
		writeStream.end(data);
	});
}

async function deleteOldFile(user: IRemoteUser) {
	const oldFile = await DriveFile.findOne({
		_id: {
			$nin: [user.avatarId, user.bannerId]
		},
		'metadata.userId': user._id
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
 * @param isLink Do not save file to local
 * @param url URL of source (URLからアップロードされた場合(ローカル/リモート)の元URL)
 * @param uri URL of source (リモートインスタンスのURLからアップロードされた場合の元URL)
 * @param sensitive Mark file as sensitive
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
	sensitive: boolean = null
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
				} else if (isSvg(buffer)) {
					res(['image/svg+xml', 'svg']);
				} else {
					// 種類が同定できなかったら application/octet-stream にする
					res(['application/octet-stream', null]);
				}
			})
			.on('end', () => {
				// maybe 0 bytes
				res(['application/octet-stream', null]);
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

	logger.info(`hash: ${hash}, mime: ${mime}, ext: ${ext}, size: ${size}`);

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
			logger.info(`file with same hash is found: ${much._id}`);
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

		logger.info(`drive usage is ${usage}`);

		const instance = await fetchMeta();
		const driveCapacity = 1024 * 1024 * (isLocalUser(user) ? instance.localDriveCapacityMb : instance.remoteDriveCapacityMb);

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

	let propPromises: Promise<void>[] = [];

	const isImage = ['image/jpeg', 'image/gif', 'image/png', 'image/webp'].includes(mime);

	if (isImage) {
		const img = sharp(path);

		// Calc width and height
		const calcWh = async () => {
			logger.debug('calculating image width and height...');

			// Calculate width and height
			const meta = await img.metadata();

			logger.debug(`image width and height is calculated: ${meta.width}, ${meta.height}`);

			properties['width'] = meta.width;
			properties['height'] = meta.height;
		};

		// Calc average color
		const calcAvg = async () => {
			logger.debug('calculating average color...');

			try {
				const info = await (img as any).stats();

				const r = Math.round(info.channels[0].mean);
				const g = Math.round(info.channels[1].mean);
				const b = Math.round(info.channels[2].mean);

				logger.debug(`average color is calculated: ${r}, ${g}, ${b}`);

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
		isSensitive: isLocalUser(user) && user.settings.alwaysMarkNsfw ? true :
			(sensitive !== null && sensitive !== undefined)
				? sensitive
				: false
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
				logger.info(`already registered ${metadata.uri}`);

				driveFile = await DriveFile.findOne({
					'metadata.uri': metadata.uri,
					'metadata.userId': user._id
				});
			} else {
				logger.error(e);
				throw e;
			}
		}
	} else {
		driveFile = await (save(path, detectedName, mime, hash, size, metadata));
	}

	logger.succ(`drive file has been created ${driveFile._id}`);

	pack(driveFile).then(packedFile => {
		// Publish driveFileCreated event
		publishMainStream(user._id, 'driveFileCreated', packedFile);
		publishDriveStream(user._id, 'fileCreated', packedFile);
	});

	// 統計を更新
	driveChart.update(driveFile, true);
	perUserDriveChart.update(driveFile, true);
	if (isRemoteUser(driveFile.metadata._user)) {
		instanceChart.updateDrive(driveFile, true);
		Instance.update({ host: driveFile.metadata._user.host }, {
			$inc: {
				driveUsage: driveFile.length,
				driveFiles: 1
			}
		});
	}

	return driveFile;
}
