/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import fastifyStatic from '@fastify/static';
import * as tmp from 'tmp';
import { StatusError } from './status-error.js';
import { detectType } from './file-type.js';
import { downloadUrl } from './download.js';
import { getProxyTargetUrl, validateProxyUserAgent } from './proxy-request.js';
import { convertProxyImage } from './proxy-image.js';
import { createProxyResponseHeaders } from './proxy-response.js';
import type { DownloadOptions } from './download.js';
import type { ProxyQuery } from './proxy-request.js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const assetsPath = fileURLToPath(new URL('../assets/', import.meta.url));

export type MediaProxyLogger = {
	warn(message: string, error?: unknown): void;
	error(message: string, error?: unknown): void;
};

export type MediaProxyPluginOptions = Partial<Pick<DownloadOptions, 'userAgent' | 'maxSize'>> & Omit<DownloadOptions, 'userAgent' | 'maxSize' | 'logger'> & {
	'Access-Control-Allow-Origin'?: string;
	'Access-Control-Allow-Headers'?: string;
	'Content-Security-Policy'?: string;
	logger?: MediaProxyLogger;
};

export const defaultMediaProxyUserAgent = 'MisskeyMediaProxy';
export const defaultMediaProxyMaxSize = 262144000;

type ProxyRequest = FastifyRequest<{ Params: { url?: string }; Querystring: ProxyQuery & { fallback?: string } }>;

function createTemp(): Promise<[string, () => void]> {
	return new Promise((res, rej) => {
		tmp.file((e, path, _fd, cleanup) => {
			if (e) return rej(e);
			res([path, cleanup]);
		});
	});
}

/**
 * スタンドアロンのメディアプロキシとして動作する Fastify プラグイン
 */
export function mediaProxyPlugin(fastify: FastifyInstance, options: MediaProxyPluginOptions, done: (err?: Error) => void) {
	const logger: MediaProxyLogger = options.logger ?? {
		warn: (message, error) => console.warn(message, ...(error != null ? [error] : [])),
		error: (message, error) => console.error(message, ...(error != null ? [error] : [])),
	};

	const downloadOptions: DownloadOptions = {
		userAgent: options.userAgent ?? defaultMediaProxyUserAgent,
		maxSize: options.maxSize ?? defaultMediaProxyMaxSize,
		getAgents: options.getAgents,
		allowedPrivateNetworks: options.allowedPrivateNetworks,
		logger,
	};

	const corsOrigin = options['Access-Control-Allow-Origin'] ?? '*';
	const corsHeader = options['Access-Control-Allow-Headers'] ?? '*';
	const csp = options['Content-Security-Policy'] ?? 'default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'';

	fastify.addHook('onRequest', (request, reply, done) => {
		reply.header('Access-Control-Allow-Origin', corsOrigin);
		reply.header('Access-Control-Allow-Headers', corsHeader);
		reply.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
		reply.header('Content-Security-Policy', csp);
		done();
	});

	fastify.register(fastifyStatic, {
		root: assetsPath,
		serve: false,
	});

	fastify.get<{ Params: { url?: string }; Querystring: ProxyQuery & { fallback?: string } }>('/:url*', async (request, reply) => {
		return await handle(request, reply)
			.catch(err => errorHandler(request, reply, err));
	});

	async function handle(request: ProxyRequest, reply: FastifyReply) {
		const url = getProxyTargetUrl(request.params.url, request.query);

		if (url == null) {
			reply.code(400);
			return;
		}

		validateProxyUserAgent(request.headers['user-agent']);

		const [path, cleanup] = await createTemp();

		try {
			const { filename } = await downloadUrl(url, path, downloadOptions);
			const { mime, ext } = await detectType(path);
			const file = { path, mime, ext };

			const image = await convertProxyImage(file, request.query) ?? {
				data: fs.createReadStream(path),
				ext,
				type: mime,
			};

			if ('pipe' in image.data && typeof image.data.pipe === 'function') {
				image.data.on('end', cleanup);
				image.data.on('close', cleanup);
			} else {
				cleanup();
			}

			reply.headers(createProxyResponseHeaders(filename, image));
			return image.data;
		} catch (e) {
			cleanup();
			throw e;
		}
	}

	function errorHandler(request: ProxyRequest, reply: FastifyReply, err?: unknown) {
		logger.error(`${err}`);

		reply.header('Cache-Control', 'max-age=300');

		if ('fallback' in request.query) {
			return reply.sendFile('dummy.png', assetsPath);
		}

		if (err instanceof StatusError && (err.statusCode === 302 || err.isClientError)) {
			reply.code(err.statusCode);
			return;
		}

		reply.code(500);
		return;
	}

	done();
}
