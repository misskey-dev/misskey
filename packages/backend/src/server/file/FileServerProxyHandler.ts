/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { convertProxyImage, createProxyResponseHeaders, getProxyTargetUrl, validateProxyUserAgent } from '@misskey-dev/media-proxy-core';
import type { ProxyQuery } from '@misskey-dev/media-proxy-core';
import type { Config } from '@/config.js';
import { StatusError } from '@/misc/status-error.js';
import type { IImageStreamable } from '@/core/ImageProcessingService.js';
import { createRangeStream, attachStreamCleanup, needsCleanup } from './FileServerUtils.js';
import type { DownloadedFileResult, FileResolveResult, FileServerFileResolver } from './FileServerFileResolver.js';
import type { FastifyReply, FastifyRequest } from 'fastify';

type ProxySource = DownloadedFileResult | FileResolveResult;
type CleanupableFile = ProxySource & { cleanup: () => void };
type AvailableFile = Exclude<ProxySource, { kind: 'not-found' | 'unavailable' }>;

export class FileServerProxyHandler {
	constructor(
		private config: Config,
		private fileResolver: FileServerFileResolver,
		private assetsPath: string,
	) {}

	public async handle(request: FastifyRequest<{ Params: { url: string }; Querystring: ProxyQuery }>, reply: FastifyReply) {
		const url = getProxyTargetUrl(request.params.url, request.query);

		if (url == null) {
			reply.code(400);
			return;
		}

		// アバタークロップなど、どうしてもオリジンである必要がある場合
		const mustOrigin = 'origin' in request.query;

		if (this.config.externalMediaProxyEnabled && !mustOrigin) {
			return await this.redirectToExternalProxy(request, reply);
		}

		validateProxyUserAgent(request.headers['user-agent']);

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

			reply.headers(createProxyResponseHeaders(file.filename, image));
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
	 * 画像を処理してストリーム可能な形式に変換する
	 */
	private async processImage(
		file: AvailableFile,
		request: FastifyRequest<{ Params: { url: string }; Querystring: ProxyQuery }>,
		reply: FastifyReply,
	): Promise<IImageStreamable> {
		return await convertProxyImage(file, request.query) ?? this.createDefaultStream(file, request, reply);
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
