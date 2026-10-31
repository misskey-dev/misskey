/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Fastify from 'fastify';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { downloadUrl } from '../../src/download/download.js';
import { getDefaultAgents } from '../../src/download/http-agent.js';
import { StatusError } from '../../src/common/status-error.js';
import { createTempDir } from '../utils.js';
import type { FastifyInstance } from 'fastify';
import type { DownloadOptions } from '../../src/download/download.js';

const body = Buffer.from('0123456789', 'utf8');

describe(downloadUrl, () => {
	let origin: FastifyInstance;
	let baseUrl: string;
	let dir: string;
	let cleanup: () => Promise<void>;
	let fileCount = 0;

	const options: DownloadOptions = {
		userAgent: 'media-core test',
		maxSize: 1024,
		allowedPrivateNetworks: ['127.0.0.1/32'],
	};

	function nextPath(): string {
		return path.join(dir, `file-${fileCount++}`);
	}

	async function getStatusCode(promise: Promise<unknown>): Promise<number | null> {
		try {
			await promise;
		} catch (e) {
			if (e instanceof StatusError) return e.statusCode;
			throw e;
		}
		return null;
	}

	beforeAll(async () => {
		const temp = await createTempDir();
		dir = temp.dir;
		cleanup = temp.cleanup;

		origin = Fastify();
		origin.get('/file.txt', async (request, reply) => {
			reply.header('Content-Type', 'text/plain');
			reply.header('X-Received-User-Agent', request.headers['user-agent'] ?? '');
			return reply.send(body);
		});
		origin.get('/with-disposition', async (_request, reply) => {
			reply.header('Content-Disposition', 'attachment; filename="named.txt"');
			return reply.send(body);
		});
		origin.get('/large', async (_request, reply) => {
			reply.header('Content-Length', String(4096));
			return reply.send(Buffer.alloc(4096));
		});
		origin.get('/redirect', async (_request, reply) => {
			return reply.redirect('/file.txt', 302);
		});
		baseUrl = await origin.listen({ port: 0, host: '127.0.0.1' });
	});

	afterAll(async () => {
		await origin.close();
		await cleanup();
	});

	test('ダウンロードし、URL のパスからファイル名を決める', async () => {
		const filePath = nextPath();
		const result = await downloadUrl(`${baseUrl}/file.txt`, filePath, options);

		expect(result.filename).toBe('file.txt');
		expect(await fs.promises.readFile(filePath)).toEqual(body);
	});

	test('Content-Disposition があればそのファイル名を使う', async () => {
		const result = await downloadUrl(`${baseUrl}/with-disposition`, nextPath(), options);

		expect(result.filename).toBe('named.txt');
	});

	test('maxSize を超えるファイルはダウンロードしない', async () => {
		await expect(downloadUrl(`${baseUrl}/large`, nextPath(), options)).rejects.toThrow();
	});

	test('エラーステータスは StatusError として返す', async () => {
		expect(await getStatusCode(downloadUrl(`${baseUrl}/not-found`, nextPath(), options))).toBe(404);
	});

	test('既定ではプライベートアドレスへの接続を拒否する', async () => {
		const { allowedPrivateNetworks: _, ...withoutAllowed } = options;

		expect(await getStatusCode(downloadUrl(`${baseUrl}/file.txt`, nextPath(), withoutAllowed))).toBe(400);
	});

	test('getAgents はリダイレクト先ごとに呼ばれる', async () => {
		const requestedUrls: string[] = [];
		const result = await downloadUrl(`${baseUrl}/redirect`, nextPath(), {
			...options,
			getAgents: (url) => {
				requestedUrls.push(url.href);
				return getDefaultAgents();
			},
		});

		// ファイル名はリダイレクト前の URL から決まる
		expect(result.filename).toBe('redirect');
		expect(requestedUrls).toEqual([`${baseUrl}/redirect`, `${baseUrl}/file.txt`]);
	});
});
