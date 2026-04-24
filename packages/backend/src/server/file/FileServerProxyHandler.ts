/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import sharp from 'sharp';
import { sharpBmp } from '@misskey-dev/sharp-read-bmp';
import type { Config } from '@/config.js';
import { FILE_TYPE_BROWSERSAFE } from '@/const.js';
import { StatusError } from '@/misc/status-error.js';
import { contentDisposition } from '@/misc/content-disposition.js';
import { correctFilename } from '@/misc/correct-filename.js';
import { isMimeImage } from '@/misc/is-mime-image.js';
import { IImageStreamable, ImageProcessingService, webpDefault } from '@/core/ImageProcessingService.js';
import { createRangeStream, attachStreamCleanup, needsCleanup } from './FileServerUtils.js';
import type { DownloadedFileResult, FileResolveResult, FileServerFileResolver } from './FileServerFileResolver.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

type ProxySource = DownloadedFileResult | FileResolveResult;
type CleanupableFile = ProxySource & { cleanup: () => void };
type AvailableFile = Exclude<ProxySource, { kind: 'not-found' | 'unavailable' }>;
type ProxyQuery = {
	emoji?: string;
	avatar?: string;
	static?: string;
	preview?: string;
	badge?: string;
	origin?: string;
	url?: string;
};

export class FileServerProxyHandler {
	constructor(
		private config: Config,
		private fileResolver: FileServerFileResolver,
		private assetsPath: string,
		private imageProcessingService: ImageProcessingService,
	) {}

	public async handle(request: FastifyRequest<{ Params: { url: string }; Querystring: ProxyQuery }>, reply: FastifyReply) {
		const url = 'url' in request.query ? request.query.url : 'https://' + request.params.url;

		if (typeof url !== 'string') {
			reply.code(400);
			return;
		}

		// アバタークロップなど、どうしてもオリジンである必要がある場合
		const mustOrigin = 'origin' in request.query;

		if (this.config.externalMediaProxyEnabled && !mustOrigin) {
			return await this.redirectToExternalProxy(request, reply);
		}

		this.validateUserAgent(request);

		// Create temp file
		const file = await this.getStreamAndTypeFromUrl(url);
		if (file.kind === 'not-found') {
			reply.code(404);
			reply.header('Cache-Control', 'max-age=86400');
			return reply.sendFile('/dummy.png', this.assetsPath);
		}

		if (file.kind === 'unavailable') {
			reply.code(204);
			reply.header('Cache-Control', 'max-age=86400');
			return;
		}

		try {
			const image = await this.processImage(file, request, reply);

			if (needsCleanup(file)) {
				attachStreamCleanup(image.data, file.cleanup);
			}

			reply.header('Content-Type', image.type);
			reply.header('Cache-Control', 'max-age=31536000, immutable');
			reply.header('Content-Disposition',
				contentDisposition(
					'inline',
					correctFilename(file.filename, image.ext),
				),
			);
			return image.data;
		} catch (e) {
			if (needsCleanup(file)) file.cleanup();
			throw e;
		}
	}

	/**
	 * 外部メディアプロキシにリダイレクトする
	 */
	private async redirectToExternalProxy(
		request: FastifyRequest<{ Params: { url: string }; Querystring: ProxyQuery }>,
		reply: FastifyReply,
	) {
		reply.header('Cache-Control', 'public, max-age=259200'); // 3 days

		const url = new URL(`${this.config.mediaProxy}/${request.params.url || ''}`);

		for (const [key, value] of Object.entries(request.query)) {
			url.searchParams.append(key, value);
		}

		return reply.redirect(url.toString(), 301);
	}

	/**
	 * User-Agent を検証する
	 */
	private validateUserAgent(request: FastifyRequest): void {
		if (!request.headers['user-agent']) {
			throw new StatusError('User-Agent is required', 400, 'User-Agent is required');
		}
		if (request.headers['user-agent'].toLowerCase().indexOf('misskey/') !== -1) {
			throw new StatusError('Refusing to proxy a request from another proxy', 403, 'Proxy is recursive');
		}
	}

	/**
	 * 画像を処理してストリーム可能な形式に変換する
	 */
	private async processImage(
		file: AvailableFile,
		request: FastifyRequest<{ Params: { url: string }; Querystring: ProxyQuery }>,
		reply: FastifyReply,
	): Promise<IImageStreamable> {
		const query = request.query;

		const requiresImageConversion = 'emoji' in query || 'avatar' in query || 'static' in query || 'preview' in query || 'badge' in query;
		const isConvertibleImage = isMimeImage(file.mime, 'sharp-convertible-image-with-bmp');
		if (requiresImageConversion && !isConvertibleImage) {
			throw new StatusError('Unexpected mime', 404);
		}

		if ('emoji' in query || 'avatar' in query) {
			return this.processEmojiOrAvatar(file, query);
		}

		if ('static' in query) {
			return this.imageProcessingService.convertSharpToWebpStream(await sharpBmp(file.path, file.mime), 498, 422);
		}

		if ('preview' in query) {
			return this.imageProcessingService.convertSharpToWebpStream(await sharpBmp(file.path, file.mime), 200, 200);
		}

		if ('badge' in query) {
			return this.processBadge(file);
		}

		if (file.mime === 'image/svg+xml') {
			return this.imageProcessingService.convertToWebpStream(file.path, 2048, 2048);
		}

		if (!file.mime.startsWith('image/') || !FILE_TYPE_BROWSERSAFE.includes(file.mime)) {
			throw new StatusError('Rejected type', 403, 'Rejected type');
		}

		return this.createDefaultStream(file, request, reply);
	}

	/**
	 * 絵文字またはアバター用の画像を処理する
	 */
	private async processEmojiOrAvatar(
		file: AvailableFile,
		query: Pick<ProxyQuery, 'emoji' | 'avatar' | 'static'>,
	): Promise<IImageStreamable> {
		const isAnimationConvertibleImage = isMimeImage(file.mime, 'sharp-animation-convertible-image-with-bmp');
		if (!isAnimationConvertibleImage && !('static' in query)) {
			return {
				data: fs.createReadStream(file.path),
				ext: file.ext,
				type: file.mime,
			};
		}

		const data = (await sharpBmp(file.path, file.mime, { animated: !('static' in query) }))
			.resize({
				height: 'emoji' in query ? 128 : 320,
				withoutEnlargement: true,
			})
			.webp(webpDefault);

		return {
			data,
			ext: 'webp',
			type: 'image/webp',
		};
	}

	/**
	 * バッジ用の画像を処理する
	 */
	private async processBadge(file: AvailableFile): Promise<IImageStreamable> {
		const mask = (await sharpBmp(file.path, file.mime))
			.resize(96, 96, {
				fit: 'contain',
				position: 'centre',
				withoutEnlargement: false,
			})
			.greyscale()
			.normalise()
			.linear(1.75, -(128 * 1.75) + 128) // 1.75x contrast
			.flatten({ background: '#000' })
			.toColorspace('b-w');

		const stats = await mask.clone().stats();

		if (stats.entropy < 0.1) {
			throw new StatusError('Skip to provide badge', 404);
		}

		const data = sharp({
			create: { width: 96, height: 96, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
		})
			.pipelineColorspace('b-w')
			.boolean(await mask.png().toBuffer(), 'eor');

		return {
			data: await data.png().toBuffer(),
			ext: 'png',
			type: 'image/png',
		};
	}

	/**
	 * デフォルトのストリームを作成する（Range リクエスト対応）
	 */
	private createDefaultStream(
		file: AvailableFile,
		request: FastifyRequest,
		reply: FastifyReply,
	): IImageStreamable {
		if (request.headers.range && 'file' in file && file.file.size > 0) {
			const { stream, start, end, chunksize } = createRangeStream(request.headers.range as string, file.file.size, file.path);

			reply.header('Content-Range', `bytes ${start}-${end}/${file.file.size}`);
			reply.header('Accept-Ranges', 'bytes');
			reply.header('Content-Length', chunksize);
			reply.code(206);

			return {
				data: stream,
				ext: file.ext,
				type: file.mime,
			};
		}

		return {
			data: fs.createReadStream(file.path),
			ext: file.ext,
			type: file.mime,
		};
	}

	private async getStreamAndTypeFromUrl(url: string): Promise<ProxySource> {
		if (url.startsWith(`${this.config.url}/files/`)) {
			const key = url.replace(`${this.config.url}/files/`, '').split('/').shift();
			if (!key) throw new StatusError('Invalid File Key', 400, 'Invalid File Key');

			return await this.fileResolver.resolveFileByAccessKey(key);
		}

		return await this.fileResolver.downloadAndDetectTypeFromUrl(url);
	}
}
