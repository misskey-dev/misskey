/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Readable } from 'node:stream';
import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Hono } from 'hono';
import { TrieRouter } from 'hono/router/trie-router';
import type { Handler } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { HttpStatusError } from '@/misc/http-status-error.js';
import type { Config } from '@/config.js';
import type { InstancesRepository, AccessTokensRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import endpoints from './endpoints.js';
import { ApiCallService } from './ApiCallService.js';
import { SignupApiService } from './SignupApiService.js';
import { SigninApiService } from './SigninApiService.js';
import { SigninWithPasskeyApiService } from './SigninWithPasskeyApiService.js';
import type { ApiContext, ApiMultipartData } from './ApiServerTypes.js';
import type { IEndpoint } from './endpoints.js';

@Injectable()
export class ApiServerService {
	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private userEntityService: UserEntityService,
		private apiCallService: ApiCallService,
		private signupApiService: SignupApiService,
		private signinApiService: SigninApiService,
		private signinWithPasskeyApiService: SigninWithPasskeyApiService,
	) {
		//this.createServer = this.createServer.bind(this);
	}

	@bindThis
	private async parseJsonBody(ctx: ApiContext): Promise<Record<string, unknown> | Response> {
		const text = await ctx.req.text();
		if (text === '') {
			return {};
		}

		try {
			const parsed = JSON.parse(text) as unknown;
			if (parsed == null || Array.isArray(parsed) || typeof parsed !== 'object') {
				return ctx.body(null, 400);
			}

			return parsed as Record<string, unknown>;
		} catch {
			return ctx.body(null, 400);
		}
	}

	@bindThis
	private async parseMultipartBody(ctx: ApiContext): Promise<ApiMultipartData | Response | null> {
		try {
			const body = await ctx.req.parseBody({ all: true });
			let file: File | null = null;
			const fields: Record<string, unknown> = {};

			for (const [key, rawValue] of Object.entries(body)) {
				const values = Array.isArray(rawValue) ? rawValue : [rawValue];
				const files = values.filter((value): value is File => value instanceof File);
				if (files.length > 0) {
					if (file != null || files.length !== 1 || values.length !== 1) {
						return ctx.body(null, 400);
					}

					file = files[0];
					continue;
				}

				fields[key] = values.length === 1 ? values[0] : values;
			}

			if (file == null) {
				return null;
			}

			return {
				filename: file.name,
				file: Readable.fromWeb(file.stream() as globalThis.ReadableStream<Uint8Array>),
				truncated: false,
				fields,
			};
		} catch {
			return ctx.body(null, 400);
		}
	}

	@bindThis
	private finalize(ctx: ApiContext, result: unknown): Response {
		if (result instanceof Response) {
			return result;
		}

		const status = ctx.res.status === 200 ? 200 : ctx.res.status;

		if (result == null) {
			return ctx.body(null, status as never);
		}

		if (typeof result === 'string') {
			if (ctx.res.headers.get('Content-Type') == null) {
				ctx.header('Content-Type', 'application/json');
			}
			return ctx.body(result, status as never);
		}

		return ctx.json(result, status as never);
	}

	@bindThis
	private async invoke(ctx: ApiContext, handler: () => Promise<unknown>): Promise<Response> {
		try {
			return this.finalize(ctx, await handler());
		} catch (err) {
			if (err instanceof HttpStatusError) {
				return ctx.body(err.message, err.statusCode as never);
			}

			throw err;
		}
	}

	@bindThis
	public createServer(): Hono<{ Variables: { ip: string; ips: string[] } }> {
		const hono = new Hono<{ Variables: { ip: string; ips: string[] } }>({
			router: new TrieRouter(),
		});

		const jsonBodyLimit = bodyLimit({
			maxSize: 1024 * 1024,
			onError: (ctx) => ctx.body(null, 413),
		});

		const multipartBodyLimit = bodyLimit({
			maxSize: this.config.maxFileSize,
			onError: (ctx) => ctx.body(null, 413),
		});

		hono.use('*', cors({
			origin: '*',
		}));

		hono.use('*', async (ctx, next) => {
			ctx.header('Cache-Control', 'private, max-age=0, must-revalidate');
			await next();
		});

		hono.use('*', async (ctx, next) => {
			if (ctx.req.method === 'GET') {
				return await next();
			}

			const contentType = ctx.req.header('Content-Type') || '';

			if (contentType.includes('multipart/form-data')) {
				return await multipartBodyLimit(ctx, next);
			} else {
				return await jsonBodyLimit(ctx, next);
			}
		});

		for (const endpoint of endpoints) {
			const handler = async (ctx: ApiContext) => {
				if (ctx.req.method === 'GET' && !endpoint.meta.allowGet) {
					return ctx.body(null, 405);
				}

				const exec = this.moduleRef.get('ep:' + endpoint.name, { strict: false }).exec;
				const ep = {
					name: endpoint.name,
					meta: endpoint.meta,
					params: endpoint.params,
					exec,
				} satisfies IEndpoint & { exec: any };

				if (endpoint.meta.requireFile) {
					const multipartData = await this.parseMultipartBody(ctx);
					if (multipartData instanceof Response) return multipartData;
					if (multipartData == null) return ctx.body(null, 400);

					return await this.apiCallService.handleMultipartRequest(ep, ctx, multipartData);
				} else {
					const parsedBody = ctx.req.method === 'GET' ? undefined : await this.parseJsonBody(ctx);
					if (parsedBody instanceof Response) return parsedBody;

					return await this.apiCallService.handleRequest(ep, ctx, parsedBody);
				}
			};

			const registerRoute = (path: string, handler: Handler) => {
				hono.post(path, handler);

				// GET が許可されている場合のみ GET も登録
				if (endpoint.meta.allowGet) {
					hono.get(path, handler);
				}
			};

			registerRoute('/' + endpoint.name, handler);
		}

		hono.post('/signup', jsonBodyLimit, async (ctx) => {
			const body = await this.parseJsonBody(ctx);
			if (body instanceof Response) return body;
			return await this.invoke(ctx, async () => await this.signupApiService.signup(ctx, body));
		});

		hono.post('/signin-flow', jsonBodyLimit, async (ctx) => {
			const body = await this.parseJsonBody(ctx);
			if (body instanceof Response) return body;
			return await this.invoke(ctx, async () => await this.signinApiService.signin(ctx, body));
		});

		hono.post('/signin-with-passkey', jsonBodyLimit, async (ctx) => {
			const body = await this.parseJsonBody(ctx);
			if (body instanceof Response) return body;
			return await this.invoke(ctx, async () => await this.signinWithPasskeyApiService.signin(ctx, body));
		});

		hono.post('/signup-pending', jsonBodyLimit, async (ctx) => {
			const body = await this.parseJsonBody(ctx);
			if (body instanceof Response) return body;
			return await this.invoke(ctx, async () => await this.signupApiService.signupPending(ctx, body));
		});

		hono.get('/v1/instance/peers', async (ctx) => {
			const instances = await this.instancesRepository.find({
				select: { host: true },
				where: {
					suspensionState: 'none',
				},
			});

			return ctx.json(instances.map(instance => instance.host));
		});

		hono.post('/miauth/:session/check', async (ctx) => {
			const token = await this.accessTokensRepository.findOneBy({
				session: ctx.req.param('session'),
			});

			if (token && token.session != null && !token.fetched) {
				this.accessTokensRepository.update(token.id, {
					fetched: true,
				});

				return ctx.json({
					ok: true,
					token: token.token,
					user: await this.userEntityService.pack(token.userId, null, { schema: 'UserDetailedNotMe' }),
				});
			} else {
				return ctx.json({
					ok: false,
				});
			}
		});

		hono.on(['GET', 'POST'], '/clear-browser-cache', (ctx) => {
			ctx.header('Clear-Site-Data', '"cache", "prefetchCache", "prerenderCache", "executionContexts"');
			return ctx.body(null, 204);
		});

		hono.all('/clear-browser-cache', (ctx) => ctx.body(null, 405));

		// Make sure any unknown path under /api returns HTTP 404 Not Found,
		// because otherwise ClientServerService will return the base client HTML
		// page with HTTP 200.
		hono.all('/*', (ctx) => {
			return ctx.json({
				error: {
					message: 'Unknown API endpoint.',
					code: 'UNKNOWN_API_ENDPOINT',
					id: '2ca3b769-540a-4f08-9dd5-b5a825b6d0f1',
					kind: 'client',
				},
			}, 404);
		});

		return hono;
	}
}
