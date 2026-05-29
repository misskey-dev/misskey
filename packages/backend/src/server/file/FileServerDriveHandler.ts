/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Readable } from 'node:stream';
import { resolve } from 'node:path';
import { promises as fsp } from 'node:fs';
import rename from 'rename';
import type { Config } from '@/config.js';
import type { IImageStreamable } from '@/core/ImageProcessingService.js';
import { contentDisposition } from '@/misc/content-disposition.js';
import { correctFilename } from '@/misc/correct-filename.js';
import { isMimeImage } from '@/misc/is-mime-image.js';
import { VideoProcessingService } from '@/core/VideoProcessingService.js';
import { bindThis } from '@/decorators.js';
import { attachStreamCleanup, handleRangeRequest, setFileResponseHeaders, getSafeContentType, nodeStreamToWebStream, bufferToWebStream } from './FileServerUtils.js';
import type { FileServerFileResolver } from './FileServerFileResolver.js';
import type { Context as HonoContext, Handler } from 'hono';

export class FileServerDriveHandler {
	constructor(
		private config: Config,
		private fileResolver: FileServerFileResolver,
		private assetsPath: string,
		private videoProcessingService: VideoProcessingService,
	) {}

	@bindThis
	public async handle(ctx: HonoContext): Promise<ReturnType<Handler>> {
		const key = ctx.req.param('key');
		if (key == null) {
			return ctx.text('Bad Request', 400);
		}

		const file = await this.fileResolver.resolveFileByAccessKey(key);

		if (file.kind === 'not-found') {
			ctx.status(404);
			ctx.header('Cache-Control', 'max-age=86400');
			const fileBuffer = await fsp.readFile(resolve(this.assetsPath, 'not-found.png'));
			return ctx.body(bufferToWebStream(fileBuffer), 200, {
				'Content-Type': 'image/png',
				'Content-Length': fileBuffer.length.toString(),
			});
		}

		if (file.kind === 'unavailable') {
			ctx.header('Cache-Control', 'max-age=86400');
			return ctx.body(null, 204);
		}

		try {
			if (file.kind === 'remote') {
				let image: IImageStreamable | null = null;

				if (file.fileRole === 'thumbnail') {
					if (isMimeImage(file.mime, 'sharp-convertible-image-with-bmp')) {
						ctx.header('Cache-Control', 'max-age=31536000, immutable');

						const url = new URL(`${this.config.mediaProxy}/static.webp`);
						url.searchParams.set('url', file.url);
						url.searchParams.set('static', '1');

						file.cleanup();
						return ctx.redirect(url.toString(), 301);
					} else if (file.mime.startsWith('video/')) {
						const externalThumbnail = this.videoProcessingService.getExternalVideoThumbnailUrl(file.url);
						if (externalThumbnail) {
							file.cleanup();
							return ctx.redirect(externalThumbnail, 301);
						}

						image = await this.videoProcessingService.generateVideoThumbnail(file.path);
					}
				}

				if (file.fileRole === 'webpublic') {
					if (['image/svg+xml'].includes(file.mime)) {
						ctx.header('Cache-Control', 'max-age=31536000, immutable');

						const url = new URL(`${this.config.mediaProxy}/svg.webp`);
						url.searchParams.set('url', file.url);

						file.cleanup();
						return ctx.redirect(url.toString(), 301);
					}
				}

				image ??= {
					data: handleRangeRequest(ctx, file.file.size, file.path),
					ext: file.ext,
					type: file.mime,
				};

				attachStreamCleanup(image.data, file.cleanup);

				ctx.header('Content-Type', getSafeContentType(image.type));
				ctx.header('Content-Length', file.file.size.toString());
				ctx.header('Cache-Control', 'max-age=31536000, immutable');
				ctx.header('Content-Disposition', contentDisposition('inline', correctFilename(file.filename, image.ext)));
				return ctx.body(image.data instanceof Readable ? nodeStreamToWebStream(image.data) : bufferToWebStream(image.data));
			}

			if (file.fileRole !== 'original') {
				const filename = rename(file.filename, {
					suffix: file.fileRole === 'thumbnail' ? '-thumb' : '-web',
					extname: file.ext ? `.${file.ext}` : '.unknown',
				}).toString();

				setFileResponseHeaders(ctx, { mime: file.mime, filename });
				return ctx.body(nodeStreamToWebStream(handleRangeRequest(ctx, file.file.size, file.path)));
			} else {
				setFileResponseHeaders(ctx, { mime: file.file.type, filename: file.filename, size: file.file.size });
				return ctx.body(nodeStreamToWebStream(handleRangeRequest(ctx, file.file.size, file.path)));
			}
		} catch (e) {
			if (file.kind === 'remote') file.cleanup();
			throw e;
		}
	}
}
