/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Fastify from 'fastify';
import sharp from 'sharp';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { createHttpAgents, mediaProxyPlugin } from '../../src/standalone.js';
import { createPatternPng } from '../utils.js';
import type { FastifyInstance } from 'fastify';
import type { MediaProxyPluginOptions } from '../../src/standalone.js';

const userAgent = 'Mozilla/5.0 (media-proxy-core test)';

const silentLogger = {
	warn: () => {},
	error: () => {},
};

async function createProxy(options: Partial<MediaProxyPluginOptions> = {}): Promise<FastifyInstance> {
	const app = Fastify();
	await app.register(mediaProxyPlugin, { logger: silentLogger, ...options });
	await app.ready();
	return app;
}

describe('mediaProxyPlugin', () => {
	let origin: FastifyInstance;
	let pngUrl: string;
	let textUrl: string;
	let notFoundUrl: string;
	let pngBuffer: Buffer;

	beforeAll(async () => {
		pngBuffer = await createPatternPng(1000, 800);

		origin = Fastify();
		origin.get('/image.png', async (_request, reply) => {
			reply.header('Content-Type', 'image/png');
			return reply.send(pngBuffer);
		});
		origin.get('/text.txt', async (_request, reply) => {
			reply.header('Content-Type', 'text/plain');
			return reply.send('dummy text');
		});
		const baseUrl = await origin.listen({ port: 0, host: '127.0.0.1' });

		pngUrl = `${baseUrl}/image.png`;
		textUrl = `${baseUrl}/text.txt`;
		notFoundUrl = `${baseUrl}/not-found.png`;
	});

	afterAll(async () => {
		await origin.close();
	});

	describe('ローカルの配信元への接続を許可した場合', () => {
		let proxy: FastifyInstance;

		beforeAll(async () => {
			proxy = await createProxy({ allowedPrivateNetworks: ['127.0.0.1/32'] });
		});

		afterAll(async () => {
			await proxy.close();
		});

		test('画像をそのまま返す', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: `/image.png?url=${encodeURIComponent(pngUrl)}`,
				headers: { 'user-agent': userAgent },
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/png');
			expect(res.headers['cache-control']).toBe('max-age=31536000, immutable');
			expect(res.headers['content-disposition']).toContain('image.png');
			expect(res.rawPayload).toEqual(pngBuffer);
		});

		test('共通のレスポンスヘッダーを付与する', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: `/image.png?url=${encodeURIComponent(pngUrl)}`,
				headers: { 'user-agent': userAgent },
			});

			expect(res.headers['access-control-allow-origin']).toBe('*');
			expect(res.headers['access-control-allow-methods']).toBe('GET, OPTIONS');
			expect(res.headers['content-security-policy']).toBe('default-src \'none\'; img-src \'self\'; media-src \'self\'; style-src \'unsafe-inline\'');
		});

		test('変換クエリに応じて変換する', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: `/emoji.webp?url=${encodeURIComponent(pngUrl)}&emoji=1`,
				headers: { 'user-agent': userAgent },
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/webp');
			expect(res.headers['content-disposition']).toContain('image.png.webp');
			const metadata = await sharp(res.rawPayload).metadata();
			expect(metadata.height).toBe(128);
		});

		test('画像以外は 403', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: `/image.webp?url=${encodeURIComponent(textUrl)}`,
				headers: { 'user-agent': userAgent },
			});

			expect(res.statusCode).toBe(403);
			expect(res.headers['cache-control']).toBe('max-age=300');
		});

		test('配信元のエラーステータスを返す', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: `/image.webp?url=${encodeURIComponent(notFoundUrl)}`,
				headers: { 'user-agent': userAgent },
			});

			expect(res.statusCode).toBe(404);
			expect(res.headers['cache-control']).toBe('max-age=300');
		});

		test('fallback 指定時はエラーでもフォールバック画像を返す', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: `/image.webp?url=${encodeURIComponent(notFoundUrl)}&fallback=1`,
				headers: { 'user-agent': userAgent },
			});

			// NOTE: Cache-Control は @fastify/static の sendFile により上書きされる (本体メディアプロキシと同じ挙動)
			expect(res.statusCode).toBe(200);
			expect(res.headers['content-type']).toBe('image/png');
		});

		test('URL の指定がなければ 400', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: '/',
				headers: { 'user-agent': userAgent },
			});

			expect(res.statusCode).toBe(400);
		});

		test('User-Agent がなければ 400', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: `/image.png?url=${encodeURIComponent(pngUrl)}`,
				headers: { 'user-agent': '' },
			});

			expect(res.statusCode).toBe(400);
		});

		test('Misskey の User-Agent は 403', async () => {
			const res = await proxy.inject({
				method: 'GET',
				url: `/image.png?url=${encodeURIComponent(pngUrl)}`,
				headers: { 'user-agent': 'Misskey/2026.10.0 (https://example.com)' },
			});

			expect(res.statusCode).toBe(403);
		});
	});

	describe('接続先の検証', () => {
		test('既定ではプライベートアドレスへの接続を拒否する', async () => {
			const proxy = await createProxy();

			const res = await proxy.inject({
				method: 'GET',
				url: `/image.png?url=${encodeURIComponent(pngUrl)}`,
				headers: { 'user-agent': userAgent },
			});
			await proxy.close();

			expect(res.statusCode).toBe(400);
		});

		test('getAgents を指定した場合は検証をエージェントに任せる', async () => {
			const proxy = await createProxy({ getAgents: () => createHttpAgents() });

			const res = await proxy.inject({
				method: 'GET',
				url: `/image.png?url=${encodeURIComponent(pngUrl)}`,
				headers: { 'user-agent': userAgent },
			});
			await proxy.close();

			expect(res.statusCode).toBe(200);
		});
	});
});
