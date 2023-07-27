/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { sharpBmp } from 'sharp-read-bmp';
import { IsNull } from 'typeorm';
import { DeleteObjectCommandInput, PutObjectCommandInput, NoSuchKey } from '@aws-sdk/client-s3';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, UsersRepository, DriveFoldersRepository, UserProfilesRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import Logger from '@/logger.js';
import type { RemoteUser, User } from '@/models/entities/User.js';
import { MetaService } from '@/core/MetaService.js';
import { DriveFile } from '@/models/entities/DriveFile.js';
import { IdService } from '@/core/IdService.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { contentDisposition } from '@/misc/content-disposition.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { VideoProcessingService } from '@/core/VideoProcessingService.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import type { IImage } from '@/core/ImageProcessingService.js';
import { QueueService } from '@/core/QueueService.js';
import type { DriveFolder } from '@/models/entities/DriveFolder.js';
import { createTemp } from '@/misc/create-temp.js';
import DriveChart from '@/core/chart/charts/drive.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import { DownloadService } from '@/core/DownloadService.js';
import { S3Service } from '@/core/S3Service.js';
import { InternalStorageService } from '@/core/InternalStorageService.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { correctFilename } from '@/misc/correct-filename.js';
import { isMimeImage } from '@/misc/is-mime-image.js';

type AddFileArgs = {
	/** User who wish to add file */
	user: { id: User['id']; host: User['host'] } | null;
	/** File path */
	path: string;
	/** Name */
	name?: string | null;
	/** Comment */
	comment?: string | null;
	/** Folder ID */
	folderId?: any;
	/** If set to true, forcibly upload the file even if there is a file with the same hash. */
	force?: boolean;
	/** Do not save file to local */
	isLink?: boolean;
	/** URL of source (URLからアップロードされた場合(ローカル/リモート)の元URL) */
	url?: string | null;
	/** URL of source (リモートインスタンスのURLからアップロードされた場合の元URL) */
	uri?: string | null;
	/** Mark file as sensitive */
	sensitive?: boolean | null;
	/** Extension to force */
	ext?: string | null;

	requestIp?: string | null;
	requestHeaders?: Record<string, string> | null;
};

type UploadFromUrlArgs = {
	url: string;
	user: { id: User['id']; host: User['host'] } | null;
	folderId?: DriveFolder['id'] | null;
	uri?: string | null;
	sensitive?: boolean;
	force?: boolean;
	isLink?: boolean;
	comment?: string | null;
	requestIp?: string | null;
	requestHeaders?: Record<string, string> | null;
};

@Injectable()
export class DriveService {
	private registerLogger: Logger;
	private downloaderLogger: Logger;
	private deleteLogger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.driveFoldersRepository)
		private driveFoldersRepository: DriveFoldersRepository,

		private fileInfoService: FileInfoService,
		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
		private metaService: MetaService,
		private downloadService: DownloadService,
		private internalStorageService: InternalStorageService,
		private s3Service: S3Service,
		private imageProcessingService: ImageProcessingService,
		private videoProcessingService: VideoProcessingService,
		private globalEventService: GlobalEventService,
		private queueService: QueueService,
		private roleService: RoleService,
		private driveChart: DriveChart,
		private perUserDriveChart: PerUserDriveChart,
		private instanceChart: InstanceChart,
	) {
		const logger = new Logger('drive', 'blue');
		this.registerLogger = logger.createSubLogger('register', 'yellow');
		this.downloaderLogger = logger.createSubLogger('downloader');
		this.deleteLogger = logger.createSubLogger('delete');
	}

	/***
	 * Save file
	 * @param path Path for original
	 * @param name Name for original (should be extention corrected)
	 * @param type Content-Type for original
	 * @param hash Hash for original
	 * @param size Size for original
	 */
	@bindThis
	private async save(file: DriveFile, path: string, name: string, type: string, hash: string, size: number): Promise<DriveFile> {
	// thunbnail, webpublic を必要なら生成
		const alts = await this.generateAlts(path, type, !file.uri);

		const meta = await this.metaService.fetch();

		if (meta.useObjectStorage) {
		//#region ObjectStorage params
			let [ext] = (name.match(/\.([a-zA-Z0-9_-]+)$/) ?? ['']);

			if (ext === '') {
				if (type === 'image/jpeg') ext = '.jpg';
				if (type === 'image/png') ext = '.png';
				if (type === 'image/webp') ext = '.webp';
				if (type === 'image/avif') ext = '.avif';
				if (type === 'image/apng') ext = '.apng';
				if (type === 'image/vnd.mozilla.apng') ext = '.apng';
			}

			// 拡張子からContent-Typeを設定してそうな挙動を示すオブジェクトストレージ (upcloud?) も存在するので、
			// 許可されているファイル形式でしかURLに拡張子をつけない
			if (!FILE_TYPE_BROWSERSAFE.includes(type)) {
				ext = '';
			}

			const baseUrl = meta.objectStorageBaseUrl
				?? `${ meta.objectStorageUseSSL ? 'https' : 'http' }://${ meta.objectStorageEndpoint }${ meta.objectStoragePort ? `:${meta.objectStoragePort}` : '' }/${ meta.objectStorageBucket }`;

			// for original
			const key = `${meta.objectStoragePrefix}/${randomUUID()}${ext}`;
			const url = `${ baseUrl }/${ key }`;

			// for alts
			let webpublicKey: string | null = null;
			let webpublicUrl: string | null = null;
			let thumbnailKey: string | null = null;
			let thumbnailUrl: string | null = null;
			//#endregion

			//#region Uploads
			this.registerLogger.info(`uploading original: ${key}`);
			const uploads = [
				this.upload(key, fs.createReadStream(path), type, null, name),
			];

			if (alts.webpublic) {
				webpublicKey = `${meta.objectStoragePrefix}/webpublic-${randomUUID()}.${alts.webpublic.ext}`;
				webpublicUrl = `${ baseUrl }/${ webpublicKey }`;

				this.registerLogger.info(`uploading webpublic: ${webpublicKey}`);
				uploads.push(this.upload(webpublicKey, alts.webpublic.data, alts.webpublic.type, alts.webpublic.ext, name));
			}

			if (alts.thumbnail) {
				thumbnailKey = `${meta.objectStoragePrefix}/thumbnail-${randomUUID()}.${alts.thumbnail.ext}`;
				thumbnailUrl = `${ baseUrl }/${ thumbnailKey }`;

				this.registerLogger.info(`uploading thumbnail: ${thumbnailKey}`);
				uploads.push(this.upload(thumbnailKey, alts.thumbnail.data, alts.thumbnail.type, alts.thumbnail.ext, `${name}.thumbnail`));
			}

			await Promise.all(uploads);
			//#endregion

			file.url = url;
			file.thumbnailUrl = thumbnailUrl;
			file.webpublicUrl = webpublicUrl;
			file.accessKey = key;
			file.thumbnailAccessKey = thumbnailKey;
			file.webpublicAccessKey = webpublicKey;
			file.webpublicType = alts.webpublic?.type ?? null;
			file.name = name;
			file.type = type;
			file.md5 = hash;
			file.size = size;
			file.storedInternal = false;

			return await this.driveFilesRepository.insert(file).then(x => this.driveFilesRepository.findOneByOrFail(x.identifiers[0]));
		} else { // use internal storage
			const accessKey = randomUUID();
			const thumbnailAccessKey = 'thumbnail-' + randomUUID();
			const webpublicAccessKey = 'webpublic-' + randomUUID();

			const url = this.internalStorageService.saveFromPath(accessKey, path);

			let thumbnailUrl: string | null = null;
			let webpublicUrl: string | null = null;

			if (alts.thumbnail) {
				thumbnailUrl = this.internalStorageService.saveFromBuffer(thumbnailAccessKey, alts.thumbnail.data);
				this.registerLogger.info(`thumbnail stored: ${thumbnailAccessKey}`);
			}

			if (alts.webpublic) {
				webpublicUrl = this.internalStorageService.saveFromBuffer(webpublicAccessKey, alts.webpublic.data);
				this.registerLogger.info(`web stored: ${webpublicAccessKey}`);
			}

			file.storedInternal = true;
			file.url = url;
			file.thumbnailUrl = thumbnailUrl;
			file.webpublicUrl = webpublicUrl;
			file.accessKey = accessKey;
			file.thumbnailAccessKey = thumbnailAccessKey;
			file.webpublicAccessKey = webpublicAccessKey;
			file.webpublicType = alts.webpublic?.type ?? null;
			file.name = name;
			file.type = type;
			file.md5 = hash;
			file.size = size;

			return await this.driveFilesRepository.insert(file).then(x => this.driveFilesRepository.findOneByOrFail(x.identifiers[0]));
		}
	}

	/**
	 * Generate webpublic, thumbnail, etc
	 * @param path Path for original
	 * @param type Content-Type for original
	 * @param generateWeb Generate webpublic or not
	 */
	@bindThis
	public async generateAlts(path: string, type: string, generateWeb: boolean) {
		if (type.startsWith('video/')) {
			if (this.config.videoThumbnailGenerator != null) {
				// videoThumbnailGeneratorが指定されていたら動画サムネイル生成はスキップ
				return {
					webpublic: null,
					thumbnail: null,
				};
			}

			try {
				const thumbnail = await this.videoProcessingService.generateVideoThumbnail(path);
				return {
					webpublic: null,
					thumbnail,
				};
			} catch (err) {
				this.registerLogger.warn(`GenerateVideoThumbnail failed: ${err}`);
				return {
					webpublic: null,
					thumbnail: null,
				};
			}
		}

		if (!isMimeImage(type, 'sharp-convertible-image-with-bmp')) {
			this.registerLogger.debug('web image and thumbnail not created (cannot convert by sharp)');
			return {
				webpublic: null,
				thumbnail: null,
			};
		}

		let img: sharp.Sharp | null = null;
		let satisfyWebpublic: boolean;
		let isAnimated: boolean;

		try {
			img = await sharpBmp(path, type);
			const metadata = await img.metadata();
			isAnimated = !!(metadata.pages && metadata.pages > 1);

			satisfyWebpublic = !!(
				type !== 'image/svg+xml' && // security reason
				type !== 'image/avif' && // not supported by Mastodon and MS Edge
			!(metadata.exif ?? metadata.iptc ?? metadata.xmp ?? metadata.tifftagPhotoshop) &&
			metadata.width && metadata.width <= 2048 &&
			metadata.height && metadata.height <= 2048
			);
		} catch (err) {
			this.registerLogger.warn(`sharp failed: ${err}`);
			return {
				webpublic: null,
				thumbnail: null,
			};
		}

		// #region webpublic
		let webpublic: IImage | null = null;

		if (generateWeb && !satisfyWebpublic && !isAnimated) {
			this.registerLogger.info('creating web image');

			try {
				if (['image/jpeg', 'image/webp', 'image/avif'].includes(type)) {
					webpublic = await this.imageProcessingService.convertSharpToWebp(img, 2048, 2048);
				} else if (['image/png', 'image/bmp', 'image/svg+xml'].includes(type)) {
					webpublic = await this.imageProcessingService.convertSharpToPng(img, 2048, 2048);
				} else {
					this.registerLogger.debug('web image not created (not an required image)');
				}
			} catch (err) {
				this.registerLogger.warn('web image not created (an error occured)', err as Error);
			}
		} else {
			if (satisfyWebpublic) this.registerLogger.info('web image not created (original satisfies webpublic)');
			else if (isAnimated) this.registerLogger.info('web image not created (animated image)');
			else this.registerLogger.info('web image not created (from remote)');
		}
		// #endregion webpublic

		// #region thumbnail
		let thumbnail: IImage | null = null;

		try {
			if (isAnimated) {
				thumbnail = await this.imageProcessingService.convertSharpToWebp(sharp(path, { animated: true }), 374, 317, { alphaQuality: 70 });
			} else {
				thumbnail = await this.imageProcessingService.convertSharpToWebp(img, 498, 422);
			}
		} catch (err) {
			this.registerLogger.warn('thumbnail not created (an error occured)', err as Error);
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
	@bindThis
	private async upload(key: string, stream: fs.ReadStream | Buffer, type: string, ext?: string | null, filename?: string) {
		if (type === 'image/apng') type = 'image/png';
		if (!FILE_TYPE_BROWSERSAFE.includes(type)) type = 'application/octet-stream';

		const meta = await this.metaService.fetch();

		const params = {
			Bucket: meta.objectStorageBucket,
			Key: key,
			Body: stream,
			ContentType: type,
			CacheControl: 'max-age=31536000, immutable',
		} as PutObjectCommandInput;

		if (filename) params.ContentDisposition = contentDisposition(
			'inline',
			// 拡張子からContent-Typeを設定してそうな挙動を示すオブジェクトストレージ (upcloud?) も存在するので、
			// 許可されているファイル形式でしか拡張子をつけない
			ext ? correctFilename(filename, ext) : filename,
		);
		if (meta.objectStorageSetPublicRead) params.ACL = 'public-read';

		await this.s3Service.upload(meta, params)
			.then(
				result => {
					if ('Bucket' in result) { // CompleteMultipartUploadCommandOutput
						this.registerLogger.debug(`Uploaded: ${result.Bucket}/${result.Key} => ${result.Location}`);
					} else { // AbortMultipartUploadCommandOutput
						this.registerLogger.error(`Upload Result Aborted: key = ${key}, filename = ${filename}`);
					}
				})
			.catch(
				err => {
					this.registerLogger.error(`Upload Failed: key = ${key}, filename = ${filename}`, err);
				},
			);
	}

	// Expire oldest file (without avatar or banner) of remote user
	@bindThis
	private async expireOldFile(user: RemoteUser, driveCapacity: number) {
		const q = this.driveFilesRepository.createQueryBuilder('file')
			.where('file.userId = :userId', { userId: user.id })
			.andWhere('file.isLink = FALSE');

		if (user.avatarId) {
			q.andWhere('file.id != :avatarId', { avatarId: user.avatarId });
		}

		if (user.bannerId) {
			q.andWhere('file.id != :bannerId', { bannerId: user.bannerId });
		}

		//This selete is hard coded, be careful if change database schema
		q.addSelect('SUM("file"."size") OVER (ORDER BY "file"."id" DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)', 'acc_usage');
		q.orderBy('file.id', 'ASC');

		const fileList = await q.getRawMany();
		const exceedFileIds = fileList.filter((x: any) => x.acc_usage > driveCapacity).map((x: any) => x.file_id);

		for (const fileId of exceedFileIds) {
			const file = await this.driveFilesRepository.findOneBy({ id: fileId });
			if (file == null) continue;
			this.deleteFile(file, true);
		}
	}

	/**
	 * Add file to drive
	 *
	 */
	@bindThis
	public async addFile({
		user,
		path,
		name = null,
		comment = null,
		folderId = null,
		force = false,
		isLink = false,
		url = null,
		uri = null,
		sensitive = null,
		requestIp = null,
		requestHeaders = null,
		ext = null,
	}: AddFileArgs): Promise<DriveFile> {
		let skipNsfwCheck = false;
		const instance = await this.metaService.fetch();
		const userRoleNSFW = user && (await this.roleService.getUserPolicies(user.id)).alwaysMarkNsfw;
		if (user == null) {
			skipNsfwCheck = true;
		} else if (userRoleNSFW) {
			skipNsfwCheck = true;
		}
		if (instance.sensitiveMediaDetection === 'none') skipNsfwCheck = true;
		if (user && instance.sensitiveMediaDetection === 'local' && this.userEntityService.isRemoteUser(user)) skipNsfwCheck = true;
		if (user && instance.sensitiveMediaDetection === 'remote' && this.userEntityService.isLocalUser(user)) skipNsfwCheck = true;

		const info = await this.fileInfoService.getFileInfo(path, {
			skipSensitiveDetection: skipNsfwCheck,
			sensitiveThreshold: // 感度が高いほどしきい値は低くすることになる
			instance.sensitiveMediaDetectionSensitivity === 'veryHigh' ? 0.1 :
			instance.sensitiveMediaDetectionSensitivity === 'high' ? 0.3 :
			instance.sensitiveMediaDetectionSensitivity === 'low' ? 0.7 :
			instance.sensitiveMediaDetectionSensitivity === 'veryLow' ? 0.9 :
			0.5,
			sensitiveThresholdForPorn: 0.75,
			enableSensitiveMediaDetectionForVideos: instance.enableSensitiveMediaDetectionForVideos,
		});
		this.registerLogger.info(`${JSON.stringify(info)}`);

		// 現状 false positive が多すぎて実用に耐えない
		//if (info.porn && instance.disallowUploadWhenPredictedAsPorn) {
		//	throw new IdentifiableError('282f77bf-5816-4f72-9264-aa14d8261a21', 'Detected as porn.');
		//}

		// detect name
		const detectedName = correctFilename(
			// DriveFile.nameは256文字, validateFileNameは200文字制限であるため、
			// extを付加してデータベースの文字数制限に当たることはまずない
			(name && this.driveFileEntityService.validateFileName(name)) ? name : 'untitled',
			ext ?? info.type.ext,
		);

		if (user && !force) {
		// Check if there is a file with the same hash
			const much = await this.driveFilesRepository.findOneBy({
				md5: info.md5,
				userId: user.id,
			});

			if (much) {
				this.registerLogger.info(`file with same hash is found: ${much.id}`);
				return much;
			}
		}

		this.registerLogger.debug(`ADD DRIVE FILE: user ${user?.id ?? 'not set'}, name ${detectedName}, tmp ${path}`);

		//#region Check drive usage
		if (user && !isLink) {
			const usage = await this.driveFileEntityService.calcDriveUsageOf(user);
			const isLocalUser = this.userEntityService.isLocalUser(user);

			const policies = await this.roleService.getUserPolicies(user.id);
			const driveCapacity = 1024 * 1024 * policies.driveCapacityMb;
			this.registerLogger.debug('drive capacity override applied');
			this.registerLogger.debug(`overrideCap: ${driveCapacity}bytes, usage: ${usage}bytes, u+s: ${usage + info.size}bytes`);

			// If usage limit exceeded
			if (driveCapacity < usage + info.size) {
				if (isLocalUser) {
					throw new IdentifiableError('c6244ed2-a39a-4e1c-bf93-f0fbd7764fa6', 'No free space.');
				}
				await this.expireOldFile(await this.usersRepository.findOneByOrFail({ id: user.id }) as RemoteUser, driveCapacity - info.size);
			}
		}
		//#endregion

		const fetchFolder = async () => {
			if (!folderId) {
				return null;
			}

			const driveFolder = await this.driveFoldersRepository.findOneBy({
				id: folderId,
				userId: user ? user.id : IsNull(),
			});

			if (driveFolder == null) throw new Error('folder-not-found');

			return driveFolder;
		};

		const properties: {
			width?: number;
			height?: number;
			orientation?: number;
		} = {};

		if (info.width) {
			properties['width'] = info.width;
			properties['height'] = info.height;
		}
		if (info.orientation != null) {
			properties['orientation'] = info.orientation;
		}

		const profile = user ? await this.userProfilesRepository.findOneBy({ userId: user.id }) : null;

		const folder = await fetchFolder();

		let file = new DriveFile();
		file.id = this.idService.genId();
		file.createdAt = new Date();
		file.userId = user ? user.id : null;
		file.userHost = user ? user.host : null;
		file.folderId = folder !== null ? folder.id : null;
		file.comment = comment;
		file.properties = properties;
		file.blurhash = info.blurhash ?? null;
		file.isLink = isLink;
		file.requestIp = requestIp;
		file.requestHeaders = requestHeaders;
		file.maybeSensitive = info.sensitive;
		file.maybePorn = info.porn;
		file.isSensitive = user
			? this.userEntityService.isLocalUser(user) && profile!.alwaysMarkNsfw ? true :
			(sensitive !== null && sensitive !== undefined)
				? sensitive
				: false
			: false;

		if (info.sensitive && profile!.autoSensitive) file.isSensitive = true;
		if (info.sensitive && instance.setSensitiveFlagAutomatically) file.isSensitive = true;
		if (userRoleNSFW) file.isSensitive = true;

		if (url !== null) {
			file.src = url;

			if (isLink) {
				file.url = url;
				// ローカルプロキシ用
				file.accessKey = randomUUID();
				file.thumbnailAccessKey = 'thumbnail-' + randomUUID();
				file.webpublicAccessKey = 'webpublic-' + randomUUID();
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

				file = await this.driveFilesRepository.insert(file).then(x => this.driveFilesRepository.findOneByOrFail(x.identifiers[0]));
			} catch (err) {
			// duplicate key error (when already registered)
				if (isDuplicateKeyValueError(err)) {
					this.registerLogger.info(`already registered ${file.uri}`);

					file = await this.driveFilesRepository.findOneBy({
						uri: file.uri!,
						userId: user ? user.id : IsNull(),
					}) as DriveFile;
				} else {
					this.registerLogger.error(err as Error);
					throw err;
				}
			}
		} else {
			file = await (this.save(file, path, detectedName, info.type.mime, info.md5, info.size));
		}

		this.registerLogger.succ(`drive file has been created ${file.id}`);

		if (user) {
			this.driveFileEntityService.pack(file, { self: true }).then(packedFile => {
				// Publish driveFileCreated event
				this.globalEventService.publishMainStream(user.id, 'driveFileCreated', packedFile);
				this.globalEventService.publishDriveStream(user.id, 'fileCreated', packedFile);
			});
		}

		this.driveChart.update(file, true);
		if (file.userHost == null) {
			// ローカルユーザーのみ
			this.perUserDriveChart.update(file, true);
		} else {
			if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
				this.instanceChart.updateDrive(file, true);
			}
		}

		return file;
	}

	@bindThis
	public async deleteFile(file: DriveFile, isExpired = false) {
		if (file.storedInternal) {
			this.internalStorageService.del(file.accessKey!);

			if (file.thumbnailUrl) {
				this.internalStorageService.del(file.thumbnailAccessKey!);
			}

			if (file.webpublicUrl) {
				this.internalStorageService.del(file.webpublicAccessKey!);
			}
		} else if (!file.isLink) {
			this.queueService.createDeleteObjectStorageFileJob(file.accessKey!);

			if (file.thumbnailUrl) {
				this.queueService.createDeleteObjectStorageFileJob(file.thumbnailAccessKey!);
			}

			if (file.webpublicUrl) {
				this.queueService.createDeleteObjectStorageFileJob(file.webpublicAccessKey!);
			}
		}

		this.deletePostProcess(file, isExpired);
	}

	@bindThis
	public async deleteFileSync(file: DriveFile, isExpired = false) {
		if (file.storedInternal) {
			this.internalStorageService.del(file.accessKey!);

			if (file.thumbnailUrl) {
				this.internalStorageService.del(file.thumbnailAccessKey!);
			}

			if (file.webpublicUrl) {
				this.internalStorageService.del(file.webpublicAccessKey!);
			}
		} else if (!file.isLink) {
			const promises = [];

			promises.push(this.deleteObjectStorageFile(file.accessKey!));

			if (file.thumbnailUrl) {
				promises.push(this.deleteObjectStorageFile(file.thumbnailAccessKey!));
			}

			if (file.webpublicUrl) {
				promises.push(this.deleteObjectStorageFile(file.webpublicAccessKey!));
			}

			await Promise.all(promises);
		}

		this.deletePostProcess(file, isExpired);
	}

	@bindThis
	private async deletePostProcess(file: DriveFile, isExpired = false) {
		// リモートファイル期限切れ削除後は直リンクにする
		if (isExpired && file.userHost !== null && file.uri != null) {
			this.driveFilesRepository.update(file.id, {
				isLink: true,
				url: file.uri,
				thumbnailUrl: null,
				webpublicUrl: null,
				storedInternal: false,
				// ローカルプロキシ用
				accessKey: randomUUID(),
				thumbnailAccessKey: 'thumbnail-' + randomUUID(),
				webpublicAccessKey: 'webpublic-' + randomUUID(),
			});
		} else {
			this.driveFilesRepository.delete(file.id);
		}

		this.driveChart.update(file, false);
		if (file.userHost == null) {
			// ローカルユーザーのみ
			this.perUserDriveChart.update(file, false);
		} else {
			if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
				this.instanceChart.updateDrive(file, false);
			}
		}
	}

	@bindThis
	public async deleteObjectStorageFile(key: string) {
		const meta = await this.metaService.fetch();
		try {
			const param = {
				Bucket: meta.objectStorageBucket,
				Key: key,
			} as DeleteObjectCommandInput;

			await this.s3Service.delete(meta, param);
		} catch (err: any) {
			if (err.name === 'NoSuchKey') {
				this.deleteLogger.warn(`The object storage had no such key to delete: ${key}. Skipping this.`, err as Error);
				return;
			} else {
				throw new Error(`Failed to delete the file from the object storage with the given key: ${key}`, {
					cause: err,
				});
			}
		}
	}

	@bindThis
	public async uploadFromUrl({
		url,
		user,
		folderId = null,
		uri = null,
		sensitive = false,
		force = false,
		isLink = false,
		comment = null,
		requestIp = null,
		requestHeaders = null,
	}: UploadFromUrlArgs): Promise<DriveFile> {
		// Create temp file
		const [path, cleanup] = await createTemp();

		try {
			// write content at URL to temp file
			const { filename: name } = await this.downloadService.downloadUrl(url, path);

			// If the comment is same as the name, skip comment
			// (image.name is passed in when receiving attachment)
			if (comment !== null && name === comment) {
				comment = null;
			}

			const driveFile = await this.addFile({ user, path, name, comment, folderId, force, isLink, url, uri, sensitive, requestIp, requestHeaders });
			this.downloaderLogger.succ(`Got: ${driveFile.id}`);
			return driveFile!;
		} catch (err) {
			this.downloaderLogger.error(`Failed to create drive file: ${err}`, {
				url: url,
				e: err,
			});
			throw err;
		} finally {
			cleanup();
		}
	}
}
