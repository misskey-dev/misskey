import * as fs from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import Koa from 'koa';
import cors from '@koa/cors';
import Router from '@koa/router';
import sharp from 'sharp';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import { isMimeImage } from '@/misc/is-mime-image.js';
import { createTemp } from '@/misc/create-temp.js';
import { DownloadService } from '@/core/DownloadService.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import type { IImage } from '@/core/ImageProcessingService.js';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';
import { StatusError } from '@/misc/status-error.js';
import type Logger from '@/logger.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { LoggerService } from '@/core/LoggerService.js';

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

		router.get('/:url*', ctx => this.handler(ctx));

		// Register router
		app.use(router.routes());

		return app;
	}

	private async handler(ctx: Koa.Context) {
		const url = 'url' in ctx.query ? ctx.query.url : 'https://' + ctx.params.url;
	
		if (typeof url !== 'string') {
			ctx.status = 400;
			return;
		}
	
		// Create temp file
		const [path, cleanup] = await createTemp();
	
		try {
			await this.downloadService.downloadUrl(url, path);
	
			const { mime, ext } = await this.fileInfoService.detectType(path);
			const isConvertibleImage = isMimeImage(mime, 'sharp-convertible-image');
	
			let image: IImage;
	
			if ('static' in ctx.query && isConvertibleImage) {
				image = await this.imageProcessingService.convertToWebp(path, 498, 280);
			} else if ('preview' in ctx.query && isConvertibleImage) {
				image = await this.imageProcessingService.convertToWebp(path, 200, 200);
			} else if ('badge' in ctx.query) {
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
			}	else if (mime === 'image/svg+xml') {
				image = await this.imageProcessingService.convertToWebp(path, 2048, 2048, 1);
			} else if (!mime.startsWith('image/') || !FILE_TYPE_BROWSERSAFE.includes(mime)) {
				throw new StatusError('Rejected type', 403, 'Rejected type');
			} else {
				image = {
					data: fs.readFileSync(path),
					ext,
					type: mime,
				};
			}
	
			ctx.set('Content-Type', image.type);
			ctx.set('Cache-Control', 'max-age=31536000, immutable');
			ctx.body = image.data;
		} catch (err) {
			this.logger.error(`${err}`);
	
			if (err instanceof StatusError && (err.statusCode === 302 || err.isClientError)) {
				ctx.status = err.statusCode;
			} else {
				ctx.status = 500;
			}
		} finally {
			cleanup();
		}
	}
}
