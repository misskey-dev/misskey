import { Buffer } from 'buffer';
import * as fs from 'fs';

import * as mongodb from 'mongodb';
import * as crypto from 'crypto';
import * as debug from 'debug';
import * as Minio from 'minio';
import * as uuid from 'uuid';
import * as sharp from 'sharp';
import * as fileType from 'file-type';
import * as isSvg from 'is-svg';

import DriveFile, { IMetadata, getDriveFileBucket, IDriveFile } from '../../models/drive-file';
import DriveFolder from '../../models/drive-folder';
import { pack } from '../../models/drive-file';
import { publishMainStream, publishDriveStream } from '../../stream';
import { isLocalUser, IUser, IRemoteUser } from '../../models/user';
import delFile from './delete-file';
import config from '../../config';
import { getDriveFileWebpublicBucket } from '../../models/drive-file-webpublic';
import { getDriveFileThumbnailBucket } from '../../models/drive-file-thumbnail';
import driveChart from '../../chart/drive';
import perUserDriveChart from '../../chart/per-user-drive';
import fetchMeta from '../../misc/fetch-meta';

const log = debug('misskey:drive:add-file');

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
	// #region webpublic
	let webpublic: Buffer;
	let webpublicExt = 'jpg';
	let webpublicType = 'image/jpeg';

	if (!metadata.uri) {	// from local instance
		log(`creating web image`);

		if (['image/jpeg'].includes(type)) {
			webpublic = await sharp(path)
				.resize(2048, 2048, {
					fit: 'inside',
					withoutEnlargement: true
				})
				.rotate()
				.jpeg({
					quality: 85,
					progressive: true
				})
				.toBuffer();
		} else if (['image/webp'].includes(type)) {
			webpublic = await sharp(path)
				.resize(2048, 2048, {
					fit: 'inside',
					withoutEnlargement: true
				})
				.rotate()
				.webp({
					quality: 85
				})
				.toBuffer();

				webpublicExt = 'webp';
				webpublicType = 'image/webp';
		} else if (['image/png'].includes(type)) {
			webpublic = await sharp(path)
				.resize(2048, 2048, {
					fit: 'inside',
					withoutEnlargement: true
				})
				.rotate()
				.png()
				.toBuffer();

			webpublicExt = 'png';
			webpublicType = 'image/png';
		} else {
			log(`web image not created (not an image)`);
		}
	} else {
		log(`web image not created (from remote)`);
	}
	// #endregion webpublic

	// #region thumbnail
	let thumbnail: Buffer;
	let thumbnailExt = 'jpg';
	let thumbnailType = 'image/jpeg';

	if (['image/jpeg', 'image/webp'].includes(type)) {
		thumbnail = await sharp(path)
			.resize(498, 280, {
				fit: 'inside',
				withoutEnlargement: true
			})
			.rotate()
			.jpeg({
				quality: 85,
				progressive: true
			})
			.toBuffer();
	} else if (['image/png'].includes(type)) {
		thumbnail = await sharp(path)
			.resize(498, 280, {
				fit: 'inside',
				withoutEnlargement: true
			})
			.rotate()
			.png()
			.toBuffer();

		thumbnailExt = 'png';
		thumbnailType = 'image/png';
	}
	// #endregion thumbnail

	if (config.drive && config.drive.storage == 'minio') {
		let [ext] = (name.match(/\.([a-zA-Z0-9_-]+)$/) || ['']);

		if (ext === '') {
			if (type === 'image/jpeg') ext = '.jpg';
			if (type === 'image/png') ext = '.png';
			if (type === 'image/webp') ext = '.webp';
		}

		const key = `${config.drive.prefix}/${uuid.v4()}${ext}`;
		const webpublicKey = `${config.drive.prefix}/${uuid.v4()}.${webpublicExt}`;
		const thumbnailKey = `${config.drive.prefix}/${uuid.v4()}.${thumbnailExt}`;

		log(`uploading original: ${key}`);
		const uploads = [
			upload(key, fs.createReadStream(path), type)
		];

		if (webpublic) {
			log(`uploading webpublic: ${webpublicKey}`);
			uploads.push(upload(webpublicKey, webpublic, webpublicType));
		}

		if (thumbnail) {
			log(`uploading thumbnail: ${thumbnailKey}`);
			uploads.push(upload(thumbnailKey, thumbnail, thumbnailType));
		}

		await Promise.all(uploads);

		const baseUrl = config.drive.baseUrl
			|| `${ config.drive.config.useSSL ? 'https' : 'http' }://${ config.drive.config.endPoint }${ config.drive.config.port ? `:${config.drive.config.port}` : '' }/${ config.drive.bucket }`;

		Object.assign(metadata, {
			withoutChunks: true,
			storage: 'minio',
			storageProps: {
				key: key,
				webpublicKey: webpublic ? webpublicKey : null,
				thumbnailKey: thumbnail ? thumbnailKey : null,
			},
			url: `${ baseUrl }/${ key }`,
			webpublicUrl: webpublic ? `${ baseUrl }/${ webpublicKey }` : null,
			thumbnailUrl: thumbnail ? `${ baseUrl }/${ thumbnailKey }` : null
		} as IMetadata);

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
		// #region store original
		const originalDst = await getDriveFileBucket();

		// web用(Exif削除済み)がある場合はオリジナルにアクセス制限
		if (webpublic) metadata.accessKey = uuid.v4();

		const originalFile = await new Promise<IDriveFile>((resolve, reject) => {
			const writeStream = originalDst.openUploadStream(name, {
				contentType: type,
				metadata
			});

			writeStream.once('finish', resolve);
			writeStream.on('error', reject);
			fs.createReadStream(path).pipe(writeStream);
		});

		log(`original stored to ${originalFile._id}`);
		// #endregion store original

		// #region store webpublic
		if (webpublic) {
			const webDst = await getDriveFileWebpublicBucket();

			const webFile = await new Promise<IDriveFile>((resolve, reject) => {
				const writeStream = webDst.openUploadStream(name, {
					contentType: webpublicType,
					metadata: {
						originalId: originalFile._id
					}
				});

				writeStream.once('finish', resolve);
				writeStream.on('error', reject);
				writeStream.end(webpublic);
			});

			log(`web stored ${webFile._id}`);
		}
		// #endregion store webpublic

		if (thumbnail) {
			const thumbnailBucket = await getDriveFileThumbnailBucket();

			const tuhmFile = await new Promise<IDriveFile>((resolve, reject) => {
				const writeStream = thumbnailBucket.openUploadStream(name, {
					contentType: thumbnailType,
					metadata: {
						originalId: originalFile._id
					}
				});

				writeStream.once('finish', resolve);
				writeStream.on('error', reject);
				writeStream.end(thumbnail);
			});

			log(`thumbnail stored ${tuhmFile._id}`);
		}

		return originalFile;
	}
}

async function upload(key: string, stream: fs.ReadStream | Buffer, type: string) {
	const minio = new Minio.Client(config.drive.config);

	await minio.putObject(config.drive.bucket, key, stream, null, {
		'Content-Type': type,
		'Cache-Control': 'max-age=31536000, immutable'
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
		// Publish driveFileCreated event
		publishMainStream(user._id, 'driveFileCreated', packedFile);
		publishDriveStream(user._id, 'fileCreated', packedFile);
	});

	// 統計を更新
	driveChart.update(driveFile, true);
	perUserDriveChart.update(driveFile, true);

	return driveFile;
}
