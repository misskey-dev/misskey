import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import fastifyStatic from '@fastify/static';
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
import { bindThis } from '@/decorators.js';
import type { FastifyInstance, FastifyRequest, FastifyReply, FastifyPluginOptions } from 'fastify';

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

		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public commonReadableHandlerGenerator(reply: FastifyReply) {
		return (err: Error): void => {
			this.logger.error(err);
			reply.code(500);
			reply.header('Cache-Control', 'max-age=300');
		};
	}
	
	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.addHook('onRequest', (request, reply, done) => {
			reply.header('Content-Security-Policy', 'default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
			done();
		});

		fastify.register(fastifyStatic, {
			root: _dirname,
			serve: false,
		});

		fastify.get('/app-default.jpg', (request, reply) => {
			const file = fs.createReadStream(`${_dirname}/assets/dummy.png`);
			reply.header('Content-Type', 'image/jpeg');
			reply.header('Cache-Control', 'max-age=31536000, immutable');
			return reply.send(file);
		});

		fastify.get<{ Params: { key: string; } }>('/:key', async (request, reply) => await this.sendDriveFile(request, reply));
		fastify.get<{ Params: { key: string; } }>('/:key/*', async (request, reply) => await this.sendDriveFile(request, reply));

		done();
	}

	@bindThis
	private async sendDriveFile(request: FastifyRequest<{ Params: { key: string; } }>, reply: FastifyReply) {
		const key = request.params.key;

		// Fetch drive file
		const file = await this.driveFilesRepository.createQueryBuilder('file')
			.where('file.accessKey = :accessKey', { accessKey: key })
			.orWhere('file.thumbnailAccessKey = :thumbnailAccessKey', { thumbnailAccessKey: key })
			.orWhere('file.webpublicAccessKey = :webpublicAccessKey', { webpublicAccessKey: key })
			.getOne();

		if (file == null) {
			reply.code(404);
			reply.header('Cache-Control', 'max-age=86400');
			return reply.sendFile('/dummy.png', assets);
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
							if (['image/jpeg', 'image/webp', 'image/avif', 'image/png', 'image/svg+xml'].includes(mime)) {
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
					reply.header('Content-Type', FILE_TYPE_BROWSERSAFE.includes(image.type) ? image.type : 'application/octet-stream');
					reply.header('Cache-Control', 'max-age=31536000, immutable');
					return image.data;
				} catch (err) {
					this.logger.error(`${err}`);

					if (err instanceof StatusError && err.isClientError) {
						reply.code(err.statusCode);
						reply.header('Cache-Control', 'max-age=86400');
					} else {
						reply.code(500);
						reply.header('Cache-Control', 'max-age=300');
					}
				} finally {
					cleanup();
				}
				return;
			}

			reply.code(204);
			reply.header('Cache-Control', 'max-age=86400');
			return;
		}

		if (isThumbnail || isWebpublic) {
			const { mime, ext } = await this.fileInfoService.detectType(this.internalStorageService.resolvePath(key));
			const filename = rename(file.name, {
				suffix: isThumbnail ? '-thumb' : '-web',
				extname: ext ? `.${ext}` : undefined,
			}).toString();

			reply.header('Content-Type', FILE_TYPE_BROWSERSAFE.includes(mime) ? mime : 'application/octet-stream');
			reply.header('Cache-Control', 'max-age=31536000, immutable');
			reply.header('Content-Disposition', contentDisposition('inline', filename));
			return this.internalStorageService.read(key);
		} else {
			const readable = this.internalStorageService.read(file.accessKey!);
			readable.on('error', this.commonReadableHandlerGenerator(reply));
			reply.header('Content-Type', FILE_TYPE_BROWSERSAFE.includes(file.type) ? file.type : 'application/octet-stream');
			reply.header('Cache-Control', 'max-age=31536000, immutable');
			reply.header('Content-Disposition', contentDisposition('inline', file.name));
			return readable;
		}
	}
}
