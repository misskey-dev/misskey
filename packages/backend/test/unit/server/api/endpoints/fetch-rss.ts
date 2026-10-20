/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import FetchRssEndpoint, { meta } from '@/server/api/endpoints/fetch-rss.js';
import { ApiError } from '@/server/api/error.js';
import type { Mocked } from 'vitest';
import type { Response } from 'node-fetch';

const rssParserMocks = vi.hoisted(() => ({
	constructor: vi.fn(),
	parseString: vi.fn(),
}));

vi.mock('rss-parser', () => ({
	default: class {
		constructor(options: unknown) {
			rssParserMocks.constructor(options);
		}

		public parseString(input: string) {
			return rssParserMocks.parseString(input);
		}
	},
}));

const RSS = '<?xml version="1.0"?><rss version="2.0"><channel><title>Test</title></channel></rss>';

function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

function response(url: string, text = RSS): Response {
	return {
		url,
		text: vi.fn().mockResolvedValue(text),
	} as unknown as Response;
}

describe('fetch-rss endpoint', () => {
	let httpRequestService: Mocked<HttpRequestService>;
	let endpoint: FetchRssEndpoint;

	beforeEach(() => {
		rssParserMocks.constructor.mockReset();
		rssParserMocks.parseString.mockReset();
		rssParserMocks.parseString.mockResolvedValue({ items: [] });
		httpRequestService = {
			send: vi.fn(),
		} as unknown as Mocked<HttpRequestService>;
		endpoint = new FetchRssEndpoint(httpRequestService);
	});

	async function exec(url: string) {
		return await endpoint.exec({ url }, null, null);
	}

	async function expectApiError(promise: Promise<unknown>, code: string, status: number) {
		await expect(promise).rejects.toMatchObject({
			code,
			httpStatusCode: status,
			info: undefined,
		});
	}

	test.each([
		'',
		'not a URL',
		'ftp://example.com/feed.xml',
		`https://example.com/${'a'.repeat(8192)}`,
	])('rejects invalid URL: %s', async (url) => {
		await expectApiError(exec(url), 'INVALID_URL', 400);
		expect(httpRequestService.send).not.toHaveBeenCalled();
	});

	test.each([
		'https://user@example.com/feed.xml',
		'https://user:password@example.com/feed.xml',
	])('rejects URL containing credentials: %s', async (url) => {
		await expectApiError(exec(url), 'INVALID_URL', 400);
		expect(httpRequestService.send).not.toHaveBeenCalled();
	});

	test('does not expose details from internal errors', async () => {
		httpRequestService.send.mockRejectedValue(new Error('secret upstream details'));

		const promise = exec('https://example.com/feed.xml');
		await expectApiError(promise, 'FETCH_RSS_FAILED', 422);
		await expect(promise).rejects.not.toMatchObject({
			message: expect.stringContaining('secret upstream details'),
		});
	});

	test('passes the 1 MiB response limit to HttpRequestService', async () => {
		httpRequestService.send.mockResolvedValue(response('https://example.com/feed.xml'));

		await exec('https://example.com/feed.xml');

		expect(httpRequestService.send).toHaveBeenCalledWith('https://example.com/feed.xml', expect.objectContaining({
			size: 1024 * 1024,
		}));
	});

	test('creates an asynchronous RSS parser for every request', async () => {
		httpRequestService.send
			.mockResolvedValueOnce(response('https://example.com/first.xml'))
			.mockResolvedValueOnce(response('https://example.com/second.xml'));

		await exec('https://example.com/first.xml');
		await exec('https://example.com/second.xml');

		expect(rssParserMocks.constructor).toHaveBeenCalledTimes(2);
		expect(rssParserMocks.constructor).toHaveBeenNthCalledWith(1, { xml2js: { async: true } });
		expect(rssParserMocks.constructor).toHaveBeenNthCalledWith(2, { xml2js: { async: true } });
	});

	test('rejects a non-HTTP final URL without exposing it', async () => {
		httpRequestService.send.mockResolvedValue(response('file:///secret/feed.xml'));

		await expectApiError(exec('https://example.com/feed.xml'), 'FETCH_RSS_FAILED', 422);
	});

	test('shares an in-flight request for the same normalized URL', async () => {
		const pending = deferred<Response>();
		httpRequestService.send.mockReturnValue(pending.promise);

		const first = exec('HTTPS://EXAMPLE.COM:443/feed.xml#first');
		const second = exec('https://example.com/feed.xml#second');
		expect(httpRequestService.send).toHaveBeenCalledTimes(1);

		pending.resolve(response('https://example.com/feed.xml'));
		await expect(Promise.all([first, second])).resolves.toHaveLength(2);
		expect(httpRequestService.send).toHaveBeenCalledTimes(1);
	});

	test('limits concurrent requests for different URLs to 32', async () => {
		const pending = deferred<Response>();
		httpRequestService.send.mockReturnValue(pending.promise);

		const requests = Array.from({ length: 32 }, (_, i) => exec(`https://example.com/${i}.xml`));
		expect(httpRequestService.send).toHaveBeenCalledTimes(32);
		await expectApiError(exec('https://example.com/overflow.xml'), 'FETCH_RSS_UNAVAILABLE', 503);
		expect(httpRequestService.send).toHaveBeenCalledTimes(32);

		pending.resolve(response('https://example.com/feed.xml'));
		await Promise.all(requests);

		httpRequestService.send.mockResolvedValue(response('https://example.com/after.xml'));
		await expect(exec('https://example.com/after.xml')).resolves.toBeDefined();
	});

	test('cleans up the in-flight request and concurrency slot after success', async () => {
		httpRequestService.send.mockResolvedValue(response('https://example.com/feed.xml'));

		await exec('https://example.com/feed.xml');
		await exec('https://example.com/feed.xml');

		expect(httpRequestService.send).toHaveBeenCalledTimes(2);
	});

	test('cleans up the in-flight request and concurrency slot after failure', async () => {
		httpRequestService.send.mockRejectedValue(new Error('upstream failed'));
		const requests = Array.from({ length: 32 }, (_, i) => exec(`https://example.com/${i}.xml`));
		await Promise.allSettled(requests);

		httpRequestService.send.mockResolvedValue(response('https://example.com/0.xml'));
		await expect(exec('https://example.com/0.xml')).resolves.toBeDefined();
		expect(httpRequestService.send).toHaveBeenCalledTimes(33);
	});

	test('has the expected rate limit metadata', () => {
		expect(meta.limit).toEqual({
			duration: 60 * 1000,
			max: 300,
		});
	});

	test('uses only the declared structured API errors', () => {
		expect(new ApiError(meta.errors.invalidUrl)).toMatchObject({ code: 'INVALID_URL', httpStatusCode: 400 });
		expect(new ApiError(meta.errors.fetchRssFailed)).toMatchObject({ code: 'FETCH_RSS_FAILED', httpStatusCode: 422 });
		expect(new ApiError(meta.errors.fetchRssUnavailable)).toMatchObject({ code: 'FETCH_RSS_UNAVAILABLE', httpStatusCode: 503 });
	});
});
