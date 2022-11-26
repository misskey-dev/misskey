import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import Koa from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';
import send from 'koa-send';
import rename from 'rename';
import type { Config } from '@/config.js';
import type { DriveFilesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { createTemp } from '@/misc/create-temp.js';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';
import { StatusError } from '@/misc/status-error.js';
import type Logger from '@/logger.js';
import { DownloadService } from '@/core/DownloadService.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import { VideoProcessingService } from '@/core/VideoProcessingService.js';
import { InternalStorageService } from '@/core/InternalStorageService.js';
import { contentDisposition } from '@/misc/content-disposition.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { LoggerService } from '@/core/LoggerService.js';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const assets = `${_dirname}/../../server/file/assets/`;

@Injectable()
export class FileServerService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private fileInfoService: FileInfoService,
		private downloadService: DownloadService,
		private imageProcessingService: ImageProcessingService,
		private videoProcessingService: VideoProcessingService,
		private internalStorageService: InternalStorageService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('server', 'gray', false);
	}

	public commonReadableHandlerGenerator(ctx: Koa.Context) {
		return (e: Error): void => {
			this.logger.error(e);
			ctx.status = 500;
			ctx.set('Cache-Control', 'max-age=300');
		};
	}
	
	public createServer() {
		const app = new Koa();
		app.use(cors());
		app.use(async (ctx, next) => {
			ctx.set('Content-Security-Policy', 'default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
			await next();
		});

		// Init router
		const router = new Router();

		router.get('/app-default.jpg', ctx => {
			const file = fs.createReadStream(`${_dirname}/assets/dummy.png`);
			ctx.body = file;
			ctx.set('Content-Type', 'image/jpeg');
			ctx.set('Cache-Control', 'max-age=31536000, immutable');
		});

		router.get('/:key', ctx => this.sendDriveFile(ctx));
		router.get('/:key/(.*)', ctx => this.sendDriveFile(ctx));

		// Register router
		app.use(router.routes());

		return app;
	}

	private async sendDriveFile(ctx: Koa.Context) {
		const key = ctx.params.key;

		// Fetch drive file
		const file = await this.driveFilesRepository.createQueryBuilder('file')
			.where('file.accessKey = :accessKey', { accessKey: key })
			.orWhere('file.thumbnailAccessKey = :thumbnailAccessKey', { thumbnailAccessKey: key })
			.orWhere('file.webpublicAccessKey = :webpublicAccessKey', { webpublicAccessKey: key })
			.getOne();

		if (file == null) {
			ctx.status = 404;
			ctx.set('Cache-Control', 'max-age=86400');
			await send(ctx as any, '/dummy.png', { root: assets });
			return;
		}

		const isThumbnail = file.thumbnailAccessKey === key;
		const isWebpublic = file.webpublicAccessKey === key;

		if (!file.storedInternal) {
			if (file.isLink && file.uri) {	// 期限切れリモートファイル
				const [path, cleanup] = await createTemp();

				try {
					await this.downloadService.downloadUrl(file.uri, path);

					const { mime, ext } = await this.fileInfoService.detectType(path);

					const convertFile = async () => {
						if (isThumbnail) {
							if (['image/jpeg', 'image/webp', 'image/png', 'image/svg+xml'].includes(mime)) {
								return await this.imageProcessingService.convertToWebp(path, 498, 280);
							} else if (mime.startsWith('video/')) {
								return await this.videoProcessingService.generateVideoThumbnail(path);
							}
						}

						if (isWebpublic) {
							if (['image/svg+xml'].includes(mime)) {
								return await this.imageProcessingService.convertToPng(path, 2048, 2048);
							}
						}

						return {
							data: fs.readFileSync(path),
							ext,
							type: mime,
						};
					};

					const image = await convertFile();
					ctx.body = image.data;
					ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(image.type) ? image.type : 'application/octet-stream');
					ctx.set('Cache-Control', 'max-age=31536000, immutable');
				} catch (err) {
					this.logger.error(`${err}`);

					if (err instanceof StatusError && err.isClientError) {
						ctx.status = err.statusCode;
						ctx.set('Cache-Control', 'max-age=86400');
					} else {
						ctx.status = 500;
						ctx.set('Cache-Control', 'max-age=300');
					}
				} finally {
					cleanup();
				}
				return;
			}

			ctx.status = 204;
			ctx.set('Cache-Control', 'max-age=86400');
			return;
		}

		if (isThumbnail || isWebpublic) {
			const { mime, ext } = await this.fileInfoService.detectType(this.internalStorageService.resolvePath(key));
			const filename = rename(file.name, {
				suffix: isThumbnail ? '-thumb' : '-web',
				extname: ext ? `.${ext}` : undefined,
			}).toString();

			ctx.body = this.internalStorageService.read(key);
			ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(mime) ? mime : 'application/octet-stream');
			ctx.set('Cache-Control', 'max-age=31536000, immutable');
			ctx.set('Content-Disposition', contentDisposition('inline', filename));
		} else {
			const readable = this.internalStorageService.read(file.accessKey!);
			readable.on('error', this.commonReadableHandlerGenerator(ctx));
			ctx.body = readable;
			ctx.set('Content-Type', FILE_TYPE_BROWSERSAFE.includes(file.type) ? file.type : 'application/octet-stream');
			ctx.set('Cache-Control', 'max-age=31536000, immutable');
			ctx.set('Content-Disposition', contentDisposition('inline', file.name));
		}
	}
}

