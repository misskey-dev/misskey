/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Readable } from 'node:stream';
import Fastify, { type FastifyInstance } from 'fastify';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { LogManager } from '@/logging/LogManager.js';
import type { AccessLogRecord, AccessLogStatusClass } from '@/logging/types.js';
import { registerHttpAccessLog } from '@/server/http-access-log.js';

type TestServer = {
	readonly fastify: FastifyInstance;
	readonly manager: LogManager;
	readonly writeAccess: ReturnType<typeof vi.fn>;
};

type TestManager = {
	readonly manager: LogManager;
	readonly writeAccess: ReturnType<typeof vi.fn>;
};

/** Access logの動作確認用に固定時刻・プロセス情報を持つManagerを作成します。 */
function createManager(options: {
	statusClasses?: AccessLogStatusClass[];
	requestBody?: boolean;
	responseBody?: boolean;
	maxBytes?: number;
	nodeEnv?: string;
	quiet?: boolean;
} = {}): TestManager {
	const writeAccess = vi.fn<(record: AccessLogRecord) => void>();
	const manager = new LogManager({ write: vi.fn(), writeAccess }, {
		now: () => new Date('2026-07-22T00:00:00.000Z'),
		getProcessInfo: () => ({ processId: 123, isPrimary: true, workerId: null }),
		isQuiet: () => options.quiet ?? false,
		isVerbose: () => false,
		getNodeEnv: () => options.nodeEnv ?? 'development',
	});
	manager.configure({
		access: {
			statusClasses: options.statusClasses ?? ['2xx', '3xx', '4xx', '5xx'],
			bodies: {
				request: options.requestBody ?? false,
				response: options.responseBody ?? false,
				maxBytes: options.maxBytes,
			},
		},
	});
	return { manager, writeAccess };
}

/** Access logフックを登録したテスト用Fastifyを作成します。 */
async function createServer(options: Parameters<typeof createManager>[0] = {}): Promise<TestServer> {
	const { manager, writeAccess } = createManager(options);
	const fastify = Fastify({ logger: false });
	registerHttpAccessLog(fastify, manager);
	fastify.get('/items/:id', async () => ({ ok: true }));
	fastify.get('/bad', async (_request, reply) => reply.code(400).send({ error: 'bad' }));
	fastify.get('/fail', async () => {
		throw new TypeError('failure');
	});
	fastify.get('/redirect', async (_request, reply) => reply.redirect('/items/redirect'));
	fastify.post('/body', async (request) => ({ echo: request.body, token: 'response-secret' }));
	fastify.get('/text', async (_request, reply) => reply.type('text/plain').send('response text'));
	fastify.get('/form', async (_request, reply) => reply.type('application/x-www-form-urlencoded').send('i=form-token&password=form-password&visible=yes'));
	fastify.get('/binary', async (_request, reply) => reply.type('application/octet-stream').send(Buffer.from('binary')));
	fastify.get('/stream', async (_request, reply) => reply.type('text/plain').send(Readable.from(['stream body'])));
	await fastify.ready();
	return { fastify, manager, writeAccess };
}

const servers: FastifyInstance[] = [];

afterEach(async () => {
	await Promise.all(servers.splice(0).map(server => server.close()));
});

describe('registerHttpAccessLog', () => {
	test('filters responses by configured status classes and keeps the route template', async () => {
		const server = await createServer({ statusClasses: ['4xx', '5xx'] });
		servers.push(server.fastify);

		await server.fastify.inject({ method: 'GET', url: '/items/secret?id=hidden' });
		await server.fastify.inject({ method: 'GET', url: '/bad' });
		await server.fastify.inject({ method: 'GET', url: '/fail' });
		await server.fastify.inject({ method: 'GET', url: '/missing?token=hidden' });

		expect(server.writeAccess).toHaveBeenCalledTimes(3);
		expect(server.writeAccess.mock.calls.map(call => call[0])).toEqual(expect.arrayContaining([
			expect.objectContaining({ route: '/bad', statusCode: 400 }),
			expect.objectContaining({ route: '/fail', statusCode: 500, errorType: 'TypeError' }),
			expect.objectContaining({ route: null, statusCode: 404 }),
		]));
		expect(server.writeAccess.mock.calls[0][0]).not.toHaveProperty('requestUrl');
		expect(server.writeAccess.mock.calls.find(call => call[0].statusCode === 404)?.[0]).not.toHaveProperty('errorType');
	});

	test('records redirects and response size when the status class is selected', async () => {
		const server = await createServer({ statusClasses: ['3xx'] });
		servers.push(server.fastify);

		await server.fastify.inject({ method: 'GET', url: '/redirect' });

		expect(server.writeAccess).toHaveBeenCalledWith(expect.objectContaining({
			method: 'GET',
			route: '/redirect',
			statusCode: 302,
			responseSizeBytes: expect.any(Number),
		}));
	});

	test('captures and redacts JSON request and response bodies in development', async () => {
		const server = await createServer({ requestBody: true, responseBody: true });
		servers.push(server.fastify);

		await server.fastify.inject({
			method: 'POST',
			url: '/body',
			headers: { 'content-type': 'application/json' },
			payload: { i: 'request-token', nested: { password: 'request-password' }, value: 'visible' },
		});

		expect(server.writeAccess).toHaveBeenCalledWith(expect.objectContaining({
			requestBody: {
				i: '[REDACTED]',
				nested: { password: '[REDACTED]' },
				value: 'visible',
			},
			responseBody: {
				echo: {
					i: '[REDACTED]',
					nested: { password: '[REDACTED]' },
					value: 'visible',
				},
				token: '[REDACTED]',
			},
		}));
	});

	test('captures text but omits binary and stream bodies', async () => {
		const server = await createServer({ statusClasses: ['2xx'], responseBody: true });
		servers.push(server.fastify);

		await server.fastify.inject({ method: 'GET', url: '/text' });
		await server.fastify.inject({ method: 'GET', url: '/binary' });
		await server.fastify.inject({ method: 'GET', url: '/stream' });

		expect(server.writeAccess.mock.calls[0][0]).toHaveProperty('responseBody', 'response text');
		expect(server.writeAccess.mock.calls[1][0]).not.toHaveProperty('responseBody');
		expect(server.writeAccess.mock.calls[2][0]).not.toHaveProperty('responseBody');
	});

	test('parses form bodies before redaction', async () => {
		const server = await createServer({ statusClasses: ['2xx'], responseBody: true });
		servers.push(server.fastify);

		await server.fastify.inject({ method: 'GET', url: '/form' });

		expect(server.writeAccess).toHaveBeenCalledWith(expect.objectContaining({
			responseBody: {
				i: '[REDACTED]',
				password: '[REDACTED]',
				visible: 'yes',
			},
		}));
	});

	test('truncates normalized bodies to the configured limit', async () => {
		const server = await createServer({ requestBody: true, responseBody: true, maxBytes: 1024 });
		servers.push(server.fastify);

		await server.fastify.inject({
			method: 'POST',
			url: '/body',
			headers: { 'content-type': 'application/json' },
			payload: { value: 'x'.repeat(20_000) },
		});

		const record = server.writeAccess.mock.calls[0][0];
		expect(Buffer.byteLength(JSON.stringify(record.requestBody), 'utf8')).toBeLessThanOrEqual(1024);
		expect(Buffer.byteLength(JSON.stringify(record.responseBody), 'utf8')).toBeLessThanOrEqual(1024);
	});

	test('preserves the response payload and reports an unknown stream size', async () => {
		const server = await createServer({ statusClasses: ['2xx'], responseBody: true });
		servers.push(server.fastify);

		const response = await server.fastify.inject({ method: 'GET', url: '/stream' });

		expect(response.body).toBe('stream body');
		expect(server.writeAccess).toHaveBeenCalledWith(expect.objectContaining({ responseSizeBytes: null }));
	});

	test('does not capture bodies in production and returns a warning', async () => {
		const { manager, writeAccess } = createManager({ nodeEnv: 'production', requestBody: true, responseBody: true });
		const warnings = manager.configure({ access: { statusClasses: ['2xx'], bodies: { request: true, response: true } } });
		const fastify = Fastify({ logger: false });
		registerHttpAccessLog(fastify, manager);
		fastify.post('/body', async request => ({ body: request.body }));
		await fastify.ready();
		servers.push(fastify);

		await fastify.inject({ method: 'POST', url: '/body', headers: { 'content-type': 'application/json' }, payload: { token: 'hidden' } });

		expect(warnings).toEqual(['logging.access.bodies is disabled in production mode']);
		expect(writeAccess).toHaveBeenCalledWith(expect.not.objectContaining({ requestBody: expect.anything(), responseBody: expect.anything() }));
	});

	test('keeps the request Trace Context through response completion', async () => {
		const server = await createServer({ statusClasses: ['2xx'] });
		servers.push(server.fastify);
		const traceContext = { traceId: 'trace', spanId: 'span', traceFlags: 1 };
		const provider = vi.fn(() => traceContext);
		server.manager.setTraceContextProvider(provider);

		await server.fastify.inject({ method: 'GET', url: '/items/trace' });

		expect(provider).toHaveBeenCalledOnce();
		expect(server.writeAccess).toHaveBeenCalledWith(expect.objectContaining(traceContext));
	});

	test('omits a Trace Context that was not active at request start', async () => {
		const server = await createServer({ statusClasses: ['2xx'] });
		servers.push(server.fastify);
		const provider = vi.fn()
			.mockReturnValueOnce(undefined)
			.mockReturnValue({ traceId: 'late-trace', spanId: 'late-span', traceFlags: 1 });
		server.manager.setTraceContextProvider(provider);

		await server.fastify.inject({ method: 'GET', url: '/items/no-trace' });

		expect(server.writeAccess.mock.calls[0][0]).not.toHaveProperty('traceId');
		expect(provider).toHaveBeenCalledOnce();
	});

	test('does not write in quiet mode', async () => {
		const server = await createServer({ quiet: true });
		servers.push(server.fastify);
		const provider = vi.fn(() => ({ traceId: 'trace', spanId: 'span', traceFlags: 1 }));
		server.manager.setTraceContextProvider(provider);

		await server.fastify.inject({ method: 'GET', url: '/items/quiet' });

		expect(provider).not.toHaveBeenCalled();
		expect(server.writeAccess).not.toHaveBeenCalled();
	});
});
