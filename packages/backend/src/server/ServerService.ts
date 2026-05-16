/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import * as fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { fileURLToPath } from 'node:url';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { createAdaptorServer } from '@hono/node-server';
import Fastify, { type FastifyInstance } from 'fastify';
import proxyAddr from '@fastify/proxy-addr';
import fastifyStatic from '@fastify/static';
import fastifyRawBody from 'fastify-raw-body';
import { Hono } from 'hono';
import { IsNull } from 'typeorm';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { Config } from '@/config.js';
import type { EmojisRepository, MiMeta, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import * as Acct from '@/misc/acct.js';
import { genIdenticon } from '@/misc/gen-identicon.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import { ActivityPubServerService } from './ActivityPubServerService.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import { ApiServerService } from './api/ApiServerService.js';
import { StreamingApiServerService } from './api/StreamingApiServerService.js';
import { WellKnownServerService } from './WellKnownServerService.js';
import { FileServerService } from './FileServerService.js';
import { HealthServerService } from './HealthServerService.js';
import { ClientServerService } from './web/ClientServerService.js';
import { OpenApiServerService } from './api/openapi/OpenApiServerService.js';
import { OAuth2ProviderService } from './oauth/OAuth2ProviderService.js';

const _dirname = fileURLToPath(new URL('.', import.meta.url));

@Injectable()
export class ServerService implements OnApplicationShutdown {
	private logger: Logger;
	#fastify: FastifyInstance;
	#legacyFastify: FastifyInstance | null = null;
	#trustProxyChecker: ((address: string, hop: number) => boolean) | undefined;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.emojisRepository)
		private emojisRepository: EmojisRepository,

		private userEntityService: UserEntityService,
		private apiServerService: ApiServerService,
		private openApiServerService: OpenApiServerService,
		private streamingApiServerService: StreamingApiServerService,
		private activityPubServerService: ActivityPubServerService,
		private wellKnownServerService: WellKnownServerService,
		private nodeinfoServerService: NodeinfoServerService,
		private fileServerService: FileServerService,
		private healthServerService: HealthServerService,
		private clientServerService: ClientServerService,
		private globalEventService: GlobalEventService,
		private loggerService: LoggerService,
		private oauth2ProviderService: OAuth2ProviderService,
	) {
		this.logger = this.loggerService.getLogger('server', 'gray');
	}

	@bindThis
	public async launch(): Promise<void> {
		const fastify = Fastify({
			trustProxy: this.config.trustProxy,
			logger: false,
		});
		this.#fastify = fastify;
		this.#trustProxyChecker = this.createTrustProxyChecker();

		const legacyFastify = Fastify({
			trustProxy: this.config.trustProxy,
			logger: false,
		});
		this.#legacyFastify = legacyFastify;

		await legacyFastify.register(fastifyRawBody, {
			global: false,
			encoding: null,
			runFirst: true,
		});

		legacyFastify.register(fastifyStatic, {
			root: _dirname,
			serve: false,
		});

		legacyFastify.register(this.apiServerService.createServer, { prefix: '/api' });
		legacyFastify.register(this.activityPubServerService.createServer);
		legacyFastify.register(this.oauth2ProviderService.createServer, { prefix: '/oauth' });
		legacyFastify.register(this.oauth2ProviderService.createTokenServer, { prefix: '/oauth/token' });
		await legacyFastify.ready();

		const hono = new Hono<{ Variables: { ip: string; ips: string[] } }>();

		hono.use(async (ctx, next) => {
			const incoming = (ctx.env as { incoming?: IncomingMessage }).incoming;
			if (incoming != null) {
				const ips = this.resolveClientIps(incoming);
				ctx.set('ips', ips);
				ctx.set('ip', ips.at(-1) ?? incoming.socket.remoteAddress ?? '');
			}
			await next();
		});

		if (this.config.url.startsWith('https') && !this.config.disableHsts) {
			hono.use(async (ctx, next) => {
				ctx.header('strict-transport-security', 'max-age=15552000; preload');
				await next();
			});
		}

		if (!this.meta.allowExternalApRedirect) {
			const maybeApLookupRegex = /application\/activity\+json|application\/ld\+json.+activitystreams/i;
			hono.use(async (ctx, next) => {
				await next();

				const location = ctx.res.headers.get('location');
				if (ctx.res.status < 300 || ctx.res.status >= 400 || location == null) {
					return;
				}

				if (!maybeApLookupRegex.test(ctx.req.header('accept') ?? '')) {
					return;
				}

				const effectiveLocation = process.env.NODE_ENV === 'production' ? location : location.replace(/^http:\/\//, 'https://');
				if (effectiveLocation.startsWith(`https://${this.config.host}/`)) {
					return;
				}

				const headers = new Headers(ctx.res.headers);
				headers.delete('location');
				headers.set('content-type', 'text/plain; charset=utf-8');
				headers.set('link', `<${encodeURI(location)}>; rel="canonical"`);
				return new Response([
					'Refusing to relay remote ActivityPub object lookup.',
					'',
					`Please remove 'application/activity+json' and 'application/ld+json' from the Accept header or fetch using the authoritative URL at ${location}.`,
				].join('\n'), { status: 406, headers });
			});
		}

		hono.get('/emoji/:path{.*}', async (ctx) => {
			const path = ctx.req.param('path');
			ctx.header('Cache-Control', 'public, max-age=86400');

			if (!path.match(/^[a-zA-Z0-9\-_@\.]+?\.webp$/)) {
				return ctx.body(null, 404);
			}

			const emojiPath = path.replace(/\.webp$/i, '');
			const pathChunks = emojiPath.split('@');
			if (pathChunks.length > 2) {
				return ctx.body(null, 400);
			}

			const name = pathChunks.shift();
			const host = pathChunks.pop();
			const emoji = await this.emojisRepository.findOneBy({
				host: (host === undefined || host === '.') ? IsNull() : host,
				name,
			});

			ctx.header('Content-Security-Policy', 'default-src \'none\'; style-src \'unsafe-inline\'');

			if (emoji == null) {
				if (ctx.req.query('fallback') != null) {
					return ctx.redirect('/static-assets/emoji-unknown.png');
				}
				return ctx.body(null, 404);
			}

			let url: URL;
			if (ctx.req.query('badge') != null) {
				url = new URL(`${this.config.mediaProxy}/emoji.png`);
				url.searchParams.set('url', emoji.publicUrl || emoji.originalUrl);
				url.searchParams.set('badge', '1');
			} else {
				url = new URL(`${this.config.mediaProxy}/emoji.webp`);
				url.searchParams.set('url', emoji.publicUrl || emoji.originalUrl);
				url.searchParams.set('emoji', '1');
				if (ctx.req.query('static') != null) {
					url.searchParams.set('static', '1');
				}
			}

			return ctx.redirect(url.toString(), 301);
		});

		hono.get('/avatar/@:acct', async (ctx) => {
			const acct = ctx.req.param('acct');
			if (acct == null) {
				return ctx.body(null, 400);
			}

			const { username, host } = Acct.parse(acct);
			const user = await this.usersRepository.findOne({
				where: {
					usernameLower: username.toLowerCase(),
					host: (host == null) || (host === this.config.host) ? IsNull() : host,
					isSuspended: false,
				},
			});

			ctx.header('Cache-Control', 'public, max-age=86400');
			if (user != null) {
				return ctx.redirect((user.avatarId == null ? null : user.avatarUrl) ?? this.userEntityService.getIdenticonUrl(user));
			}
			return ctx.redirect('/static-assets/user-unknown.png');
		});

		hono.get('/identicon/:x', async (ctx) => {
			ctx.header('Content-Type', 'image/png');
			ctx.header('Cache-Control', 'public, max-age=86400');
			if (this.meta.enableIdenticonGeneration) {
				const image = await genIdenticon(ctx.req.param('x'));
				return ctx.body(new Uint8Array(image));
			}
			return ctx.redirect('/static-assets/avatar.png');
		});

		hono.route('/', this.openApiServerService.createServer());
		hono.route('/', this.nodeinfoServerService.createServer());
		hono.route('/', this.wellKnownServerService.createServer());
		hono.route('/healthz', this.healthServerService.createServer());
		hono.route('/', this.fileServerService.createServer());
		hono.route('/', this.clientServerService.createServer());

		hono.all('*', async (ctx) => {
			const requestUrl = new URL(ctx.req.url);
			const method = ctx.req.method;
			const body = method === 'GET' || method === 'HEAD'
				? undefined
				: Buffer.from(await ctx.req.raw.arrayBuffer());

			const incoming = (ctx.env as { incoming?: IncomingMessage }).incoming;
			const response = await legacyFastify.inject({
				method: method as any,
				url: `${requestUrl.pathname}${requestUrl.search}`,
				headers: Object.fromEntries(ctx.req.raw.headers.entries()),
				payload: body,
				remoteAddress: incoming?.socket.remoteAddress,
			} as any) as {
				statusCode: number;
				headers: Record<string, string | string[] | number | undefined>;
				payload: string;
			};

			const headers = new Headers();
			for (const [key, value] of Object.entries(response.headers)) {
				if (Array.isArray(value)) {
					for (const item of value) {
						headers.append(key, String(item));
					}
				} else if (value != null) {
					headers.set(key, String(value));
				}
			}

			return new Response(response.payload, { status: response.statusCode, headers });
		});

		const honoNodeServer = createAdaptorServer({
			fetch: hono.fetch,
		});

		fastify.addHook('onRequest', async (request, reply) => {
			reply.hijack();
			await new Promise<void>((resolve, reject) => {
				let settled = false;
				const done = () => {
					if (settled) return;
					settled = true;
					reply.raw.off('finish', done);
					reply.raw.off('close', done);
					reply.raw.off('error', onError);
					resolve();
				};
				const onError = (error: Error) => {
					if (settled) return;
					settled = true;
					reply.raw.off('finish', done);
					reply.raw.off('close', done);
					reply.raw.off('error', onError);
					reject(error);
				};

				reply.raw.on('finish', done);
				reply.raw.on('close', done);
				reply.raw.on('error', onError);

				honoNodeServer.emit('request', request.raw, reply.raw);
			});
		});

		this.streamingApiServerService.attach(fastify.server);

		fastify.server.on('error', err => {
			switch ((err as any).code) {
				case 'EACCES':
					this.logger.error(`You do not have permission to listen on port ${this.config.port}.`);
					break;
				case 'EADDRINUSE':
					this.logger.error(`Port ${this.config.port} is already in use by another process.`);
					break;
				default:
					this.logger.error(err);
					break;
			}

			if (cluster.isWorker) {
				process.send!('listenFailed');
			} else {
				process.exit(1);
			}
		});

		if (this.config.socket) {
			if (fs.existsSync(this.config.socket)) {
				fs.unlinkSync(this.config.socket);
			}
			fastify.listen({ path: this.config.socket }, () => {
				if (this.config.chmodSocket) {
					fs.chmodSync(this.config.socket!, this.config.chmodSocket);
				}
			});
		} else {
			fastify.listen({ port: this.config.port, host: '0.0.0.0' });
		}

		await fastify.ready();
	}

	private createTrustProxyChecker(): ((address: string, hop: number) => boolean) | undefined {
		const trustProxy = this.config.trustProxy;
		if (trustProxy === false) {
			return undefined;
		}

		if (trustProxy === true) {
			return () => true;
		}

		if (typeof trustProxy === 'number') {
			return (_address, hop) => hop < trustProxy;
		}

		if (typeof trustProxy === 'function') {
			return trustProxy;
		}

		return proxyAddr.compile(trustProxy);
	}

	private resolveClientIps(request: IncomingMessage): string[] {
		const socketAddress = request.socket.remoteAddress;
		if (this.#trustProxyChecker == null) {
			return socketAddress == null ? [] : [socketAddress];
		}

		try {
			return proxyAddr.all(request, this.#trustProxyChecker);
		} catch {
			return socketAddress == null ? [] : [socketAddress];
		}
	}

	@bindThis
	public async dispose(): Promise<void> {
		await this.streamingApiServerService.detach();
		if (this.#legacyFastify != null) {
			await this.#legacyFastify.close();
			this.#legacyFastify = null;
		}
		await this.#fastify.close();
	}

	/**
	 * Get the Fastify instance for testing.
	 */
	public get fastify(): FastifyInstance {
		return this.#fastify;
	}

	@bindThis
	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}
