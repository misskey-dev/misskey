/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolve } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Config } from '@/config.js';
import type { DriveFilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { StatusError } from '@/misc/status-error.js';
import type Logger from '@/logger.js';
import { DownloadService } from '@/core/DownloadService.js';
import { InternalStorageService } from '@/core/InternalStorageService.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import { VideoProcessingService } from '@/core/VideoProcessingService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import { handleRequestRedirectToOmitSearch } from '@/misc/hono-middleware-handlers.js';
import { FileServerDriveHandler } from './file/FileServerDriveHandler.js';
import { FileServerFileResolver } from './file/FileServerFileResolver.js';
import { FileServerProxyHandler } from './file/FileServerProxyHandler.js';
import type { Context as HonoContext } from 'hono';

@Injectable()
export class FileServerService {
	private logger: Logger;
	private driveHandler: FileServerDriveHandler;
	private proxyHandler: FileServerProxyHandler;
	private fileResolver: FileServerFileResolver;

	private readonly assets: string;

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
		this.logger = this.loggerService.getLogger('server', 'gray');
		this.assets = resolve(this.config.rootDir, 'packages/backend/src/server/file/assets');
		this.fileResolver = new FileServerFileResolver(
			this.driveFilesRepository,
			this.fileInfoService,
			this.downloadService,
			this.internalStorageService,
		);
		this.driveHandler = new FileServerDriveHandler(
			this.config,
			this.fileResolver,
			this.assets,
			this.videoProcessingService,
		);
		this.proxyHandler = new FileServerProxyHandler(
			this.config,
			this.fileResolver,
			this.assets,
			this.imageProcessingService,
		);

		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	public createServer(): Hono {
		const hono = new Hono();

		hono.use(async (ctx, next) => {
			ctx.header('Content-Security-Policy', 'default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
			if (process.env.NODE_ENV === 'development') {
				ctx.header('Access-Control-Allow-Origin', '*');
			}
			await next();
		});

		hono.use(handleRequestRedirectToOmitSearch);

		hono.get('/files/app-default.jpg', serveStatic({
			path: resolve(this.assets, 'dummy.png'),
			onFound: (_, ctx) => {
				ctx.header('Content-Type', 'image/jpeg');
				ctx.header('Cache-Control', 'max-age=31536000, immutable');
			},
		}));

		hono.get('/files/:key', this.driveHandler.handle);
		hono.get('/files/:key/*', (ctx) => {
			return ctx.redirect(`${this.config.url}/files/${ctx.req.param('key')}`, 301);
		});

		hono.get('/proxy/:url*', this.proxyHandler.handle);

		hono.onError(this.errorHandler);

		return hono;
	}

	@bindThis
	private async errorHandler(err: any, ctx: HonoContext): Promise<Response> {
		this.logger.error(`${err}`);

		ctx.header('Cache-Control', 'max-age=300');

		if (ctx.req.query('static') != null) {
			await serveStatic({ path: resolve(this.assets, 'dummy.png') })(ctx, async () => {});
			return ctx.res;
		}

		if (err instanceof StatusError && (err.statusCode === 302 || err.isClientError)) {
			ctx.status(err.statusCode);
			return ctx.text(err.message);
		}

		ctx.status(500);
		return ctx.text('Internal Server Error');
	}
}
