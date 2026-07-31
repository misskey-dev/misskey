/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setImmediate } from 'node:timers/promises';
import Fastify, { type FastifyInstance, type FastifyReply } from 'fastify';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { defineOperationMemo, OperationContextService } from '@/core/OperationContextService.js';
import { ApiServerService } from '@/server/api/ApiServerService.js';

const endpoints = vi.hoisted(() => [
	{
		name: 'test/regular',
		meta: {},
		params: {},
	},
	{
		name: 'test/multipart',
		meta: { requireFile: true },
		params: {},
	},
]);

vi.mock('@/server/api/endpoints.js', () => ({
	default: endpoints,
}));

type HandlerName = 'handleRequest' | 'handleMultipartRequest';

async function createServer() {
	const operationContextService = new OperationContextService();
	const runRoot = vi.spyOn(operationContextService, 'runRoot');
	const apiCallService = {
		handleRequest: vi.fn(),
		handleMultipartRequest: vi.fn(),
	};
	const service = new ApiServerService(
		{ get: vi.fn(() => ({ exec: vi.fn() })) } as never,
		{ maxFileSize: 1024 * 1024 } as never,
		{ find: vi.fn() } as never,
		{ findOneBy: vi.fn(), update: vi.fn() } as never,
		{ pack: vi.fn() } as never,
		operationContextService,
		apiCallService as never,
		{ signup: vi.fn(), signupPending: vi.fn() } as never,
		{ signin: vi.fn() } as never,
		{ signin: vi.fn() } as never,
	);
	const fastify = Fastify();
	service.createServer(fastify, {}, error => {
		if (error != null) throw error;
	});
	await fastify.ready();

	return { apiCallService, fastify, operationContextService, runRoot };
}

describe('ApiServerService operation context boundary', () => {
	const servers: FastifyInstance[] = [];

	afterEach(async () => {
		await Promise.all(servers.splice(0).map(server => server.close()));
	});

	test.each([
		['regular', '/test/regular', 'handleRequest'],
		['multipart', '/test/multipart', 'handleMultipartRequest'],
	] as const)('%s requests share one context and isolate separate requests', async (_label, url, handlerName: HandlerName) => {
		const { apiCallService, fastify, operationContextService, runRoot } = await createServer();
		servers.push(fastify);
		const token = defineOperationMemo<void, object>('api server test', () => 'value');
		const loader = vi.fn(() => ({}));
		const values: object[][] = [];
		apiCallService[handlerName].mockImplementation(async (...args: unknown[]) => {
			const first = await operationContextService.memoizeIfActive(token, undefined, loader);
			await setImmediate();
			const second = await operationContextService.memoizeIfActive(token, undefined, loader);
			values.push([first, second]);
			(args[2] as FastifyReply).send({ ok: true });
		});

		const firstResponse = await fastify.inject({ method: 'POST', url });
		const secondResponse = await fastify.inject({ method: 'POST', url });

		expect(firstResponse.statusCode).toBe(200);
		expect(secondResponse.statusCode).toBe(200);
		expect(runRoot).toHaveBeenCalledTimes(2);
		expect(values[0][0]).toBe(values[0][1]);
		expect(values[1][0]).toBe(values[1][1]);
		expect(values[0][0]).not.toBe(values[1][0]);
		expect(loader).toHaveBeenCalledTimes(2);
	});

	test.each([
		['regular', '/test/regular', 'handleRequest'],
		['multipart', '/test/multipart', 'handleMultipartRequest'],
	] as const)('%s request errors propagate to Fastify', async (_label, url, handlerName: HandlerName) => {
		const { apiCallService, fastify, runRoot } = await createServer();
		servers.push(fastify);
		apiCallService[handlerName].mockRejectedValue(new Error('failed'));

		const response = await fastify.inject({ method: 'POST', url });

		expect(response.statusCode).toBe(500);
		expect(runRoot).toHaveBeenCalledOnce();
	});
});
