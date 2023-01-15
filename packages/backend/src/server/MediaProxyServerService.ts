import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import fastifyStatic from '@fastify/static';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { isMimeImage } from '@/misc/is-mime-image.js';
import { createTemp } from '@/misc/create-temp.js';
import { DownloadService } from '@/core/DownloadService.js';
import { ImageProcessingService, webpDefault } from '@/core/ImageProcessingService.js';
import type { IImage } from '@/core/ImageProcessingService.js';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';
import { StatusError } from '@/misc/status-error.js';
import type Logger from '@/logger.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';

const _filename = fileURLToPath(import.meta.url);
const _dirname = dirname(_filename);

const assets = `${_dirname}/../../src/server/assets/`;

@Injectable()
export class MediaProxyServerService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		private fileInfoService: FileInfoService,
		private downloadService: DownloadService,
		private imageProcessingService: ImageProcessingService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('server', 'gray', false);

		//this.createServer = this.createServer.bind(this);
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

		fastify.get<{
			Params: { url: string; };
			Querystring: { url?: string; };
		}>('/:url*', async (request, reply) => await this.handler(request, reply));

		done();
	}

	@bindThis
	private async handler(request: FastifyRequest<{ Params: { url: string; }; Querystring: { url?: string; }; }>, reply: FastifyReply) {
		const url = 'url' in request.query ? request.query.url : 'https://' + request.params.url;
	
		if (typeof url !== 'string') {
			reply.code(400);
			return;
		}
	
		// Create temp file
		const [path, cleanup] = await createTemp();
	
		try {
			await this.downloadService.downloadUrl(url, path);
	
			const { mime, ext } = await this.fileInfoService.detectType(path);
			const isConvertibleImage = isMimeImage(mime, 'sharp-convertible-image');
			const isAnimationConvertibleImage = isMimeImage(mime, 'sharp-animation-convertible-image');
	
			let image: IImage;
			if ('emoji' in request.query && isConvertibleImage) {
				if (!isAnimationConvertibleImage && !('static' in request.query)) {
					image = {
						data: fs.readFileSync(path),
						ext,
						type: mime,
					};
				} else {
					const data = await sharp(path, { animated: !('static' in request.query) })
					.resize({
						height: 128,
						withoutEnlargement: true,
					})
					.webp(webpDefault)
					.toBuffer();

					image = {
						data,
						ext: 'webp',
						type: 'image/webp',
					};
				}
			} else if ('static' in request.query && isConvertibleImage) {
				image = await this.imageProcessingService.convertToWebp(path, 498, 280);
			} else if ('preview' in request.query && isConvertibleImage) {
				image = await this.imageProcessingService.convertToWebp(path, 200, 200);
			} else if ('badge' in request.query) {
				if (!isConvertibleImage) {
					// 画像でないなら404でお茶を濁す
					throw new StatusError('Unexpected mime', 404);
				}

				const mask = sharp(path)
					.resize(96, 96, {
						fit: 'inside',
						withoutEnlargement: false,
					})
					.greyscale()
					.normalise()
					.linear(1.75, -(128 * 1.75) + 128) // 1.75x contrast
					.flatten({ background: '#000' })
					.toColorspace('b-w');
	
				const stats = await mask.clone().stats();
	
				if (stats.entropy < 0.1) {
					// エントロピーがあまりない場合は404にする
					throw new StatusError('Skip to provide badge', 404);
				}
	
				const data = sharp({
					create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
				})
					.pipelineColorspace('b-w')
					.boolean(await mask.png().toBuffer(), 'eor');
	
				image = {
					data: await data.png().toBuffer(),
					ext: 'png',
					type: 'image/png',
				};
			} else if (mime === 'image/svg+xml') {
				image = await this.imageProcessingService.convertToWebp(path, 2048, 2048, webpDefault);
			} else if (!mime.startsWith('image/') || !FILE_TYPE_BROWSERSAFE.includes(mime)) {
				throw new StatusError('Rejected type', 403, 'Rejected type');
			} else {
				image = {
					data: fs.readFileSync(path),
					ext,
					type: mime,
				};
			}
	
			reply.header('Content-Type', image.type);
			reply.header('Cache-Control', 'max-age=31536000, immutable');
			return image.data;
		} catch (err) {
			this.logger.error(`${err}`);

			if ('fallback' in request.query) {
				return reply.sendFile('/dummy.png', assets);
			}
	
			if (err instanceof StatusError && (err.statusCode === 302 || err.isClientError)) {
				reply.code(err.statusCode);
			} else {
				reply.code(500);
			}
		} finally {
			cleanup();
		}
	}
}
