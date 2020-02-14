import * as fs from 'fs';

import { v4 as uuid } from 'uuid';

import { publishMainStream, publishDriveStream } from '../stream';
import { deleteFile } from './delete-file';
import { fetchMeta } from '../../misc/fetch-meta';
import { GenerateVideoThumbnail } from './generate-video-thumbnail';
import { driveLogger } from './logger';
import { IImage, convertToJpeg, convertToWebp, convertToPng, convertToPngOrJpeg } from './image-processor';
import { contentDisposition } from '../../misc/content-disposition';
import { getFileInfo } from '../../misc/get-file-info';
import { DriveFiles, DriveFolders, Users, Instances, UserProfiles } from '../../models';
import { InternalStorage } from './internal-storage';
import { DriveFile } from '../../models/entities/drive-file';
import { IRemoteUser, User } from '../../models/entities/user';
import { driveChart, perUserDriveChart, instanceChart } from '../chart';
import { genId } from '../../misc/gen-id';
import { isDuplicateKeyValueError } from '../../misc/is-duplicate-key-value-error';
import * as S3 from 'aws-sdk/clients/s3';
import { getS3 } from './s3';

const logger = driveLogger.createSubLogger('register', 'yellow');

/***
 * Save file
 * @param path Path for original
 * @param name Name for original
 * @param type Content-Type for original
 * @param hash Hash for original
 * @param size Size for original
 */
async function save(file: DriveFile, path: string, name: string, type: string, hash: string, size: number): Promise<DriveFile> {
	// thunbnail, webpublic を必要なら生成
	const alts = await generateAlts(path, type, !file.uri);

	const meta = await fetchMeta();

	if (meta.useObjectStorage) {
		//#region ObjectStorage params
		let [ext] = (name.match(/\.([a-zA-Z0-9_-]+)$/) || ['']);

		if (ext === '') {
			if (type === 'image/jpeg') ext = '.jpg';
			if (type === 'image/png') ext = '.png';
			if (type === 'image/webp') ext = '.webp';
			if (type === 'image/apng') ext = '.apng';
			if (type === 'image/vnd.mozilla.apng') ext = '.apng';
		}

		const baseUrl = meta.objectStorageBaseUrl
			|| `${ meta.objectStorageUseSSL ? 'https' : 'http' }://${ meta.objectStorageEndpoint }${ meta.objectStoragePort ? `:${meta.objectStoragePort}` : '' }/${ meta.objectStorageBucket }`;

		// for original
		const key = `${meta.objectStoragePrefix}/${uuid()}${ext}`;
		const url = `${ baseUrl }/${ key }`;

		// for alts
		let webpublicKey: string | null = null;
		let webpublicUrl: string | null = null;
		let thumbnailKey: string | null = null;
		let thumbnailUrl: string | null = null;
		//#endregion

		//#region Uploads
		logger.info(`uploading original: ${key}`);
		const uploads = [
			upload(key, fs.createReadStream(path), type, name)
		];

		if (alts.webpublic) {
			webpublicKey = `${meta.objectStoragePrefix}/webpublic-${uuid()}.${alts.webpublic.ext}`;
			webpublicUrl = `${ baseUrl }/${ webpublicKey }`;

			logger.info(`uploading webpublic: ${webpublicKey}`);
			uploads.push(upload(webpublicKey, alts.webpublic.data, alts.webpublic.type, name));
		}

		if (alts.thumbnail) {
			thumbnailKey = `${meta.objectStoragePrefix}/thumbnail-${uuid()}.${alts.thumbnail.ext}`;
			thumbnailUrl = `${ baseUrl }/${ thumbnailKey }`;

			logger.info(`uploading thumbnail: ${thumbnailKey}`);
			uploads.push(upload(thumbnailKey, alts.thumbnail.data, alts.thumbnail.type));
		}

		await Promise.all(uploads);
		//#endregion

		file.url = url;
		file.thumbnailUrl = thumbnailUrl;
		file.webpublicUrl = webpublicUrl;
		file.accessKey = key;
		file.thumbnailAccessKey = thumbnailKey;
		file.webpublicAccessKey = webpublicKey;
		file.name = name;
		file.type = type;
		file.md5 = hash;
		file.size = size;
		file.storedInternal = false;

		return await DriveFiles.save(file);
	} else { // use internal storage
		const accessKey = uuid();
		const thumbnailAccessKey = 'thumbnail-' + uuid();
		const webpublicAccessKey = 'webpublic-' + uuid();

		const url = InternalStorage.saveFromPath(accessKey, path);

		let thumbnailUrl: string | null = null;
		let webpublicUrl: string | null = null;

		if (alts.thumbnail) {
			thumbnailUrl = InternalStorage.saveFromBuffer(thumbnailAccessKey, alts.thumbnail.data);
			logger.info(`thumbnail stored: ${thumbnailAccessKey}`);
		}

		if (alts.webpublic) {
			webpublicUrl = InternalStorage.saveFromBuffer(webpublicAccessKey, alts.webpublic.data);
			logger.info(`web stored: ${webpublicAccessKey}`);
		}

		file.storedInternal = true;
		file.url = url;
		file.thumbnailUrl = thumbnailUrl;
		file.webpublicUrl = webpublicUrl;
		file.accessKey = accessKey;
		file.thumbnailAccessKey = thumbnailAccessKey;
		file.webpublicAccessKey = webpublicAccessKey;
		file.name = name;
		file.type = type;
		file.md5 = hash;
		file.size = size;

		return await DriveFiles.save(file);
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
	let webpublic: IImage | null = null;

	if (generateWeb) {
		logger.info(`creating web image`);

		try {
			if (['image/jpeg'].includes(type)) {
				webpublic = await convertToJpeg(path, 2048, 2048);
			} else if (['image/webp'].includes(type)) {
				webpublic = await convertToWebp(path, 2048, 2048);
			} else if (['image/png'].includes(type)) {
				webpublic = await convertToPng(path, 2048, 2048);
			} else {
				logger.debug(`web image not created (not an required image)`);
			}
		} catch (e) {
			logger.warn(`web image not created (an error occured)`, e);
		}
	} else {
		logger.info(`web image not created (from remote)`);
	}
	// #endregion webpublic

	// #region thumbnail
	let thumbnail: IImage | null = null;

	try {
		if (['image/jpeg', 'image/webp'].includes(type)) {
			thumbnail = await convertToJpeg(path, 498, 280);
		} else if (['image/png'].includes(type)) {
			thumbnail = await convertToPngOrJpeg(path, 498, 280);
		} else if (type.startsWith('video/')) {
			try {
				thumbnail = await GenerateVideoThumbnail(path);
			} catch (e) {
				logger.warn(`GenerateVideoThumbnail failed: ${e}`);
			}
		} else {
			logger.debug(`thumbnail not created (not an required file)`);
		}
	} catch (e) {
		logger.warn(`thumbnail not created (an error occured)`, e);
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
async function upload(key: string, stream: fs.ReadStream | Buffer, type: string, filename?: string) {
	if (type === 'image/apng') type = 'image/png';

	const meta = await fetchMeta();

	const params = {
		Bucket: meta.objectStorageBucket,
		Key: key,
		Body: stream,
		ContentType: type,
		CacheControl: 'max-age=31536000, immutable',
	} as S3.PutObjectRequest;

	if (filename) params.ContentDisposition = contentDisposition('inline', filename);

	const s3 = getS3(meta);

	const upload = s3.upload(params);

	await upload.promise();
}

async function deleteOldFile(user: IRemoteUser) {
	const q = DriveFiles.createQueryBuilder('file')
		.where('file.userId = :userId', { userId: user.id });

	if (user.avatarId) {
		q.andWhere('file.id != :avatarId', { avatarId: user.avatarId });
	}

	if (user.bannerId) {
		q.andWhere('file.id != :bannerId', { bannerId: user.bannerId });
	}

	q.orderBy('file.id', 'ASC');

	const oldFile = await q.getOne();

	if (oldFile) {
		deleteFile(oldFile, true);
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
	user: User | null,
	path: string,
	name: string | null = null,
	comment: string | null = null,
	folderId: any = null,
	force: boolean = false,
	isLink: boolean = false,
	url: string | null = null,
	uri: string | null = null,
	sensitive: boolean | null = null
): Promise<DriveFile> {
	const info = await getFileInfo(path);
	logger.info(`${JSON.stringify(info)}`);

	// detect name
	const detectedName = name || (info.type.ext ? `untitled.${info.type.ext}` : 'untitled');

	if (user && !force) {
		// Check if there is a file with the same hash
		const much = await DriveFiles.findOne({
			md5: info.md5,
			userId: user.id,
		});

		if (much) {
			logger.info(`file with same hash is found: ${much.id}`);
			return much;
		}
	}

	//#region Check drive usage
	if (user && !isLink) {
		const usage = await DriveFiles.clacDriveUsageOf(user);

		const instance = await fetchMeta();
		const driveCapacity = 1024 * 1024 * (Users.isLocalUser(user) ? instance.localDriveCapacityMb : instance.remoteDriveCapacityMb);

		logger.debug(`drive usage is ${usage} (max: ${driveCapacity})`);

		// If usage limit exceeded
		if (usage + info.size > driveCapacity) {
			if (Users.isLocalUser(user)) {
				throw new Error('no-free-space');
			} else {
				// (アバターまたはバナーを含まず)最も古いファイルを削除する
				deleteOldFile(user as IRemoteUser);
			}
		}
	}
	//#endregion

	const fetchFolder = async () => {
		if (!folderId) {
			return null;
		}

		const driveFolder = await DriveFolders.findOne({
			id: folderId,
			userId: user ? user.id : null
		});

		if (driveFolder == null) throw new Error('folder-not-found');

		return driveFolder;
	};

	const properties: {
		width?: number;
		height?: number;
		avgColor?: string;
	} = {};

	if (info.width) {
		properties['width'] = info.width;
		properties['height'] = info.height;
	}

	if (info.avgColor) {
		properties['avgColor'] = `rgb(${info.avgColor.join(',')})`;
	}

	const profile = user ? await UserProfiles.findOne(user.id) : null;

	const folder = await fetchFolder();

	let file = new DriveFile();
	file.id = genId();
	file.createdAt = new Date();
	file.userId = user ? user.id : null;
	file.userHost = user ? user.host : null;
	file.folderId = folder !== null ? folder.id : null;
	file.comment = comment;
	file.properties = properties;
	file.isLink = isLink;
	file.isSensitive = user
		? Users.isLocalUser(user) && profile!.alwaysMarkNsfw ? true :
			(sensitive !== null && sensitive !== undefined)
				? sensitive
				: false
		: false;

	if (url !== null) {
		file.src = url;

		if (isLink) {
			file.url = url;
			// ローカルプロキシ用
			file.accessKey = uuid();
			file.thumbnailAccessKey = 'thumbnail-' + uuid();
			file.webpublicAccessKey = 'webpublic-' + uuid();
		}
	}

	if (uri !== null) {
		file.uri = uri;
	}

	if (isLink) {
		try {
			file.size = 0;
			file.md5 = info.md5;
			file.name = detectedName;
			file.type = info.type.mime;
			file.storedInternal = false;

			file = await DriveFiles.save(file);
		} catch (e) {
			// duplicate key error (when already registered)
			if (isDuplicateKeyValueError(e)) {
				logger.info(`already registered ${file.uri}`);

				file = await DriveFiles.findOne({
					uri: file.uri,
					userId: user ? user.id : null
				}) as DriveFile;
			} else {
				logger.error(e);
				throw e;
			}
		}
	} else {
		file = await (save(file, path, detectedName, info.type.mime, info.md5, info.size));
	}

	logger.succ(`drive file has been created ${file.id}`);

	if (user) {
		DriveFiles.pack(file, { self: true }).then(packedFile => {
			// Publish driveFileCreated event
			publishMainStream(user.id, 'driveFileCreated', packedFile);
			publishDriveStream(user.id, 'fileCreated', packedFile);
		});
	}

	// 統計を更新
	driveChart.update(file, true);
	perUserDriveChart.update(file, true);
	if (file.userHost !== null) {
		instanceChart.updateDrive(file, true);
		Instances.increment({ host: file.userHost }, 'driveUsage', file.size);
		Instances.increment({ host: file.userHost }, 'driveFiles', 1);
	}

	return file;
}
