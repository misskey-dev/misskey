/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import fastifyStatic from '@fastify/static';
import Fastify, { type FastifyInstance } from 'fastify';
import { describe, expect, test } from '@jest/globals';
import sharp from 'sharp';
import { DataSource, type Repository } from 'typeorm';
import { initTestDb, randomString } from '../../utils.js';
import type { AiService } from '@/core/AiService.js';
import { DownloadService } from '@/core/DownloadService.js';
import { FileInfoService } from '@/core/FileInfoService.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { ImageProcessingService } from '@/core/ImageProcessingService.js';
import { InternalStorageService } from '@/core/InternalStorageService.js';
import { IdService } from '@/core/IdService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { VideoProcessingService } from '@/core/VideoProcessingService.js';
import { loadConfig, type Config } from '@/config.js';
import { MiDriveFile } from '@/models/DriveFile.js';
import { FileServerService } from '@/server/FileServerService.js';

const dummyPath = path.resolve('test/resources/dummy-for-file-server-service.png');
const dummySize = fs.statSync(dummyPath).size;
const dummyBuffer = fs.readFileSync(dummyPath);
const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"></svg>', 'utf8');
const textBuffer = Buffer.from('dummy text', 'utf8');

async function createRemoteFileServer() {
	const flatPngBuffer = await sharp({
		create: { width: 8, height: 8, channels: 3, background: { r: 0, g: 0, b: 0 } },
	}).png().toBuffer();
	const server = Fastify();

	server.get('/dummy.png', async (_request, reply) => {
		reply.header('Content-Type', 'image/png');
		reply.header('Content-Length', String(dummyBuffer.length));
		return reply.send(dummyBuffer);
	});

	server.get('/dummy.svg', async (_request, reply) => {
		reply.header('Content-Type', 'image/svg+xml');
		reply.header('Content-Length', String(svgBuffer.length));
		return reply.send(svgBuffer);
	});

	server.get('/dummy.txt', async (_request, reply) => {
		reply.header('Content-Type', 'text/plain');
		reply.header('Content-Length', String(textBuffer.length));
		return reply.send(textBuffer);
	});

	server.get('/flat.png', async (_request, reply) => {
		reply.header('Content-Type', 'image/png');
		reply.header('Content-Length', String(flatPngBuffer.length));
		return reply.send(flatPngBuffer);
	});

	const baseUrl = await server.listen({ port: 0, host: '127.0.0.1' });

	return {
		server,
		pngUrl: `${baseUrl}/dummy.png`,
		svgUrl: `${baseUrl}/dummy.svg`,
		textUrl: `${baseUrl}/dummy.txt`,
		flatPngUrl: `${baseUrl}/flat.png`,
	};
}

describe('FileServerService', () => {
	let db: DataSource;
	let fastify: FastifyInstance;
	let externalFastify: FastifyInstance;
	let driveFilesRepository: Repository<MiDriveFile>;
	let internalStorageService: InternalStorageService;
	let idService: IdService;
	let config: Config;
	let fileServerService: FileServerService;
	let externalFileServerService: FileServerService;
	let remoteServer: FastifyInstance;
	let remotePngUrl: string;
	let remoteSvgUrl: string;
	let remoteTextUrl: string;
	let remoteFlatPngUrl: string;
	const storedPaths: string[] = [];
	let createdFallbackAssets = false;
	let fallbackAssetsDir = '';

	function writeInternalFile(key: string) {
		const dest = internalStorageService.resolvePath(key);
		fs.mkdirSync(path.dirname(dest), { recursive: true });
		fs.copyFileSync(dummyPath, dest);
		storedPaths.push(dest);
	}

	async function insertDriveFile(params: {
		accessKey: string;
		thumbnailAccessKey?: string | null;
		webpublicAccessKey?: string | null;
		storedInternal: boolean;
		isLink: boolean;
		uri?: string | null;
		name?: string;
		type?: string;
		size?: number;
	}) {
		const accessKey = params.accessKey;
		const url = params.uri ?? `${config.url}/files/${accessKey}`;
		await driveFilesRepository.insert({
			id: idService.gen(),
			userId: null,
			userHost: null,
			md5: '00000000000000000000000000000000',
			name: params.name ?? 'dummy.png',
			type: params.type ?? 'image/png',
			size: params.size ?? dummySize,
			comment: null,
			blurhash: null,
			properties: {},
			storedInternal: params.storedInternal,
			url,
			thumbnailUrl: null,
			webpublicUrl: null,
			webpublicType: null,
			accessKey,
			thumbnailAccessKey: params.thumbnailAccessKey ?? null,
			webpublicAccessKey: params.webpublicAccessKey ?? null,
			uri: params.uri ?? null,
			src: null,
			folderId: null,
			isSensitive: false,
			maybeSensitive: false,
			maybePorn: false,
			isLink: params.isLink,
			requestHeaders: {},
			requestIp: null,
		});
	}

	beforeAll(async () => {
		config = loadConfig();
		db = await initTestDb(false);
		driveFilesRepository = db.getRepository(MiDriveFile);

		const loggerService = new LoggerService();
		const aiService = {
			detectSensitive: async () => null,
		} as unknown as AiService;
		const fileInfoService = new FileInfoService(aiService, loggerService);
		const httpRequestService = new HttpRequestService(config);
		const downloadService = new DownloadService(config, httpRequestService, loggerService);
		const imageProcessingService = new ImageProcessingService();
		const videoProcessingService = new VideoProcessingService(config, imageProcessingService);
		internalStorageService = new InternalStorageService(config);
		idService = new IdService(config);
		fileServerService = new FileServerService(
			config,
			driveFilesRepository as any,
			fileInfoService,
			downloadService,
			imageProcessingService,
			videoProcessingService,
			internalStorageService,
			loggerService,
		);

		fastify = Fastify();
		await fastify.register(fastifyStatic, {
			root: path.resolve('src/server/assets'),
			serve: false,
		});
		fileServerService.createServer(fastify, {}, () => {});
		await fastify.ready();

		const externalConfig = {
			...config,
			mediaProxy: 'https://media-proxy.test',
			externalMediaProxyEnabled: true,
		} as Config;
		externalFileServerService = new FileServerService(
			externalConfig,
			driveFilesRepository as any,
			fileInfoService,
			downloadService,
			imageProcessingService,
			videoProcessingService,
			internalStorageService,
			loggerService,
		);
		externalFastify = Fastify();
		await externalFastify.register(fastifyStatic, {
			root: path.resolve('src/server/assets'),
			serve: false,
		});
		externalFileServerService.createServer(externalFastify, {}, () => {});
		await externalFastify.ready();

		const remoteServerInfo = await createRemoteFileServer();
		remoteServer = remoteServerInfo.server;
		remotePngUrl = remoteServerInfo.pngUrl;
		remoteSvgUrl = remoteServerInfo.svgUrl;
		remoteTextUrl = remoteServerInfo.textUrl;
		remoteFlatPngUrl = remoteServerInfo.flatPngUrl;

		fallbackAssetsDir = path.resolve('src/server/file/assets');
		if (!fs.existsSync(fallbackAssetsDir)) {
			fs.mkdirSync(fallbackAssetsDir, { recursive: true });
			fs.copyFileSync(dummyPath, path.join(fallbackAssetsDir, 'dummy.png'));
			createdFallbackAssets = true;
		}
	});

	afterEach(async () => {
		await driveFilesRepository.createQueryBuilder().delete().execute();
		for (const filePath of storedPaths) {
			try {
				fs.unlinkSync(filePath);
			} catch {
				// NOP
			}
		}
		storedPaths.length = 0;
	});

	afterAll(async () => {
		await fastify.close();
		await externalFastify.close();
		await remoteServer.close();
		await db.destroy();
		if (createdFallbackAssets) {
			fs.rmSync(fallbackAssetsDir, { recursive: true, force: true });
		}
	});

	describe('GET /files/app-default.jpg', () => {
		test('GET /files/app-default.jpg ヘッダを検証する', async () => {
			const prevNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'test';

			try {
				const res = await fastify.inject({
					method: 'GET',
					url: '/files/app-default.jpg',
				});

				expect(res.statusCode).toBe(200);
				expect(res.headers['content-security-policy']).toBe('default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
				expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
				expect(res.headers['content-type']).toBe('image/jpeg');
				expect(res.headers['access-control-allow-origin']).toBeUndefined();
			} finally {
				process.env.NODE_ENV = prevNodeEnv;
			}
		});

		test('GET /files/app-default.jpg development で CORS を許可する', async () => {
			const prevNodeEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'development';

			try {
				const res = await fastify.inject({
					method: 'GET',
					url: '/files/app-default.jpg',
				});

				expect(res.statusCode).toBe(200);
				expect(res.headers['access-control-allow-origin']).toBe('*');
			} finally {
				process.env.NODE_ENV = prevNodeEnv;
			}
		});

		test('GET /files/app-default.jpg?x=1 クエリを除去してリダイレクトする', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: '/files/app-default.jpg?x=1',
			});

			expect(res.statusCode).toBe(301);
			expect(res.headers.location).toBe('/files/app-default.jpg');
			expect(res.headers['content-security-policy']).toBe('default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
		});
	});

	describe('GET /files/:key', () => {
		test('GET /files/:key 404 のときダミー画像を返す', async () => {
			const accessKey = randomString();

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${accessKey}`,
			});

			expect(res.statusCode).toBe(404);
			expect(res.headers['cache-control']).toBe('max-age=86400');
		});

		test('GET /files/:key 画像配信ヘッダを検証する', async () => {
			const accessKey = randomString();
			writeInternalFile(accessKey);
			await insertDriveFile({
				accessKey,
				storedInternal: true,
				isLink: false,
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${accessKey}`,
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-security-policy']).toBe('default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['content-length']).toBe(String(dummySize));
			expect(res.headers['content-disposition'] ?? '').toMatch(/^inline;/);
		});

		test('GET /files/:key Range で部分配信する', async () => {
			const accessKey = randomString();
			writeInternalFile(accessKey);
			await insertDriveFile({
				accessKey,
				storedInternal: true,
				isLink: false,
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${accessKey}`,
				headers: {
					range: 'bytes=0-3',
				},
			});

			expect(res.statusCode).toBe(206);
			expect(res.headers['content-range']).toBe(`bytes 0-3/${dummySize}`);
			expect(res.headers['accept-ranges']).toBe('bytes');
			expect(res.headers['content-length']).toBe('4');
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
		});

		test('GET /files/:key Range の終端を補正する', async () => {
			const accessKey = randomString();
			writeInternalFile(accessKey);
			await insertDriveFile({
				accessKey,
				storedInternal: true,
				isLink: false,
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${accessKey}`,
				headers: {
					range: 'bytes=0-999999',
				},
			});

			expect(res.statusCode).toBe(206);
			expect(res.headers['content-range']).toBe(`bytes 0-${dummySize - 1}/${dummySize}`);
			expect(res.headers['accept-ranges']).toBe('bytes');
			expect(res.headers['content-length']).toBe(String(dummySize));
		});

		test('GET /files/:key thumbnail の Range で部分配信する', async () => {
			const accessKey = randomString();
			const thumbnailKey = randomString();
			writeInternalFile(thumbnailKey);
			await insertDriveFile({
				accessKey,
				thumbnailAccessKey: thumbnailKey,
				storedInternal: true,
				isLink: false,
				name: 'sample.png',
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${thumbnailKey}`,
				headers: {
					range: 'bytes=0-3',
				},
			});

			expect(res.statusCode).toBe(206);
			expect(res.headers['content-range']).toBe(`bytes 0-3/${dummySize}`);
			expect(res.headers['accept-ranges']).toBe('bytes');
			expect(res.headers['content-length']).toBe('4');
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
		});

		test('GET /files/:key thumbnail のファイル名を整形する', async () => {
			const accessKey = randomString();
			const thumbnailKey = randomString();
			writeInternalFile(thumbnailKey);
			await insertDriveFile({
				accessKey,
				thumbnailAccessKey: thumbnailKey,
				storedInternal: true,
				isLink: false,
				name: 'sample.png',
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${thumbnailKey}`,
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition'] ?? '').toContain('sample-thumb.png');
		});

		test('GET /files/:key webpublic のファイル名を整形する', async () => {
			const accessKey = randomString();
			const webpublicKey = randomString();
			writeInternalFile(webpublicKey);
			await insertDriveFile({
				accessKey,
				webpublicAccessKey: webpublicKey,
				storedInternal: true,
				isLink: false,
				name: 'sample.png',
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${webpublicKey}`,
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition'] ?? '').toContain('sample-web.png');
		});

		test('GET /files/:key browsersafe でない MIME は octet-stream になる', async () => {
			const accessKey = randomString();
			writeInternalFile(accessKey);
			await insertDriveFile({
				accessKey,
				storedInternal: true,
				isLink: false,
				type: 'application/x-msdownload',
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${accessKey}`,
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('application/octet-stream');
		});

		test('GET /files/:key 204 のときキャッシュ制御を返す', async () => {
			const accessKey = randomString();
			await insertDriveFile({
				accessKey,
				storedInternal: false,
				isLink: false,
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${accessKey}`,
			});

			expect(res.statusCode).toBe(204);
			expect(res.headers['cache-control']).toBe('max-age=86400');
		});

		test('GET /files/:key 外部リンクを取得して配信する', async () => {
			const accessKey = randomString();
			await insertDriveFile({
				accessKey,
				storedInternal: false,
				isLink: true,
				uri: remotePngUrl,
				name: 'remote.png',
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${accessKey}`,
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-length']).toBe(String(dummyBuffer.length));
			expect(res.headers['content-disposition'] ?? '').toContain('remote.png');
		});

		test('GET /files/:key 外部リンクを Range で部分配信する', async () => {
			const accessKey = randomString();
			await insertDriveFile({
				accessKey,
				storedInternal: false,
				isLink: true,
				uri: remotePngUrl,
				name: 'remote.png',
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${accessKey}`,
				headers: {
					range: 'bytes=0-3',
				},
			});

			expect(res.statusCode).toBe(206);
			expect(res.headers['content-range']).toBe(`bytes 0-3/${dummyBuffer.length}`);
			expect(res.headers['accept-ranges']).toBe('bytes');
			expect(res.headers['content-length']).toBe(String(dummyBuffer.length));
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
		});

		test('GET /files/:key thumbnail は mediaProxy/static.webp にリダイレクトする', async () => {
			const accessKey = randomString();
			const thumbnailKey = randomString();
			await insertDriveFile({
				accessKey,
				thumbnailAccessKey: thumbnailKey,
				storedInternal: false,
				isLink: true,
				uri: remotePngUrl,
				name: 'remote.png',
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${thumbnailKey}`,
			});

			expect(res.statusCode).toBe(301);
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers.location).toContain(`${config.mediaProxy}/static.webp`);
			expect(res.headers.location).toContain('static=1');
		});

		test('GET /files/:key webpublic svg は mediaProxy/svg.webp にリダイレクトする', async () => {
			const accessKey = randomString();
			const webpublicKey = randomString();
			await insertDriveFile({
				accessKey,
				webpublicAccessKey: webpublicKey,
				storedInternal: false,
				isLink: true,
				uri: remoteSvgUrl,
				name: 'vector.svg',
				type: 'image/svg+xml',
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/files/${webpublicKey}`,
			});

			expect(res.statusCode).toBe(301);
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers.location).toContain(`${config.mediaProxy}/svg.webp`);
		});
	});

	describe('GET /files/:key/*', () => {
		test('GET /files/:key/* 正規の /files/:key にリダイレクトする', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: '/files/testkey/extra/path',
			});

			expect(res.statusCode).toBe(301);
			expect(res.headers.location).toBe(`${config.url}/files/testkey`);
			expect(res.headers['content-security-policy']).toBe('default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
		});
	});

	describe('GET /proxy/:url*', () => {
		test('GET /proxy/:url* 外部メディアプロキシへリダイレクトする', async () => {
			const res = await externalFastify.inject({
				method: 'GET',
				url: '/proxy/path-part?url=https%3A%2F%2Fexample.com%2Fimg.png&static=1',
			});

			expect(res.statusCode).toBe(301);
			expect(res.headers['cache-control']).toBe('public, max-age=259200');
			expect(res.headers.location).toContain('https://media-proxy.test/');
			expect(res.headers.location).toContain('url=https%3A%2F%2Fexample.com%2Fimg.png');
			expect(res.headers.location).toContain('static=1');
			expect(res.headers['content-security-policy']).toBe('default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
		});

		test('GET /proxy/:url* misskey User-Agent を拒否する', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: '/proxy/any?url=https%3A%2F%2Fexample.com%2Fimg.png',
				headers: {
					'user-agent': 'misskey/1.0',
				},
			});

			expect(res.statusCode).toBe(403);
			expect(res.headers['cache-control']).toBe('max-age=300');
		});

		test('GET /proxy/:url* origin 指定時は User-Agent 必須を検証する', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: '/proxy/any?url=https%3A%2F%2Fexample.com%2Fimg.png&origin=1',
				headers: {
					'user-agent': '',
				},
			});

			expect(res.statusCode).toBe(400);
			expect(res.headers['cache-control']).toBe('max-age=300');
			expect(res.headers.location).toBeUndefined();
			expect(res.headers['content-security-policy']).toBe('default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
		});

		test('GET /proxy/:url* emoji 指定で非画像は 404 を返す', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(remoteTextUrl)}&emoji=1`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(404);
			expect(res.headers['cache-control']).toBe('max-age=300');
		});

		test('GET /proxy/:url* 非画像は 403 を返す', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(remoteTextUrl)}`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(403);
			expect(res.headers['cache-control']).toBe('max-age=300');
		});

		test('GET /proxy/:url* emoji static で webp を返す', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(remotePngUrl)}&emoji=1&static=1`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/webp');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition'] ?? '').toContain('dummy.png.webp');
		});

		test('GET /proxy/:url* avatar static で webp を返す', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(remotePngUrl)}&avatar=1&static=1`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/webp');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition'] ?? '').toContain('dummy.png.webp');
		});

		test('GET /proxy/:url* static で webp を返す', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(remotePngUrl)}&static=1`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/webp');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition'] ?? '').toContain('dummy.png.webp');
		});

		test('GET /proxy/:url* preview で webp を返す', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(remotePngUrl)}&preview=1`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/webp');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition'] ?? '').toContain('dummy.png.webp');
		});

		test('GET /proxy/:url* svg を webp に変換する', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(remoteSvgUrl)}`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/webp');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition'] ?? '').toContain('dummy.svg.webp');
		});

		test('GET /proxy/:url* badge で低エントロピー画像は 404 を返す', async () => {
			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(remoteFlatPngUrl)}&badge=1`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(404);
			expect(res.headers['cache-control']).toBe('max-age=300');
		});

		test('GET /proxy/:url* 画像をそのまま返す', async () => {
			const accessKey = randomString();
			writeInternalFile(accessKey);
			await insertDriveFile({
				accessKey,
				storedInternal: true,
				isLink: false,
			});

			const res = await fastify.inject({
				method: 'GET',
				url: `/proxy/any?url=${encodeURIComponent(`${config.url}/files/${accessKey}`)}&origin=1`,
				headers: {
					'user-agent': 'Mozilla/5.0',
				},
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition'] ?? '').toContain('dummy.png');
		});
	});
});
