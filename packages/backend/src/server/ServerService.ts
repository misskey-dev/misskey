/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import type { IncomingMessage } from 'node:http';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { createAdaptorServer } from '@hono/node-server';
import type { ServerType } from '@hono/node-server';
import proxyAddr from '@fastify/proxy-addr';
import { Hono } from 'hono';
import { IsNull } from 'typeorm';
import type { Config } from '@/config.js';
import type { EmojisRepository, MiMeta, UsersRepository } from '@/models/_.js';
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

@Injectable()
export class ServerService implements OnApplicationShutdown {
	private logger: Logger;
	#honoNodeServer: ServerType | null = null;
	#trustProxyChecker: ((address: string, hop: number) => boolean) | undefined;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

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
		private loggerService: LoggerService,
		private oauth2ProviderService: OAuth2ProviderService,
	) {
		this.logger = this.loggerService.getLogger('server', 'gray');
	}

	@bindThis
	public async launch(): Promise<void> {
		this.#trustProxyChecker = this.createTrustProxyChecker();

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

		hono.route('/api', this.apiServerService.createServer());
		hono.route('/', this.openApiServerService.createServer());
		hono.route('/', this.nodeinfoServerService.createServer());
		hono.route('/', this.wellKnownServerService.createServer());
		hono.route('/healthz', this.healthServerService.createServer());
		hono.route('/', this.activityPubServerService.createServer());
		hono.route('/', this.fileServerService.createServer());
		hono.route('/', this.clientServerService.createServer());
		hono.route('/oauth', this.oauth2ProviderService.createServer());

		this.#honoNodeServer = createAdaptorServer({
			fetch: hono.fetch,
		});

		// WebSocket
		this.#honoNodeServer.on('upgrade', (req, socket, head) => {
			const url = new URL(req.url ?? '', `http://${req.headers['host'] ?? 'localhost'}`);

			if (url.pathname === '/streaming') {
				this.streamingApiServerService.handleUpgrade(req, socket, head);
			} else {
				socket.destroy();
			}
		});

		await this.listen();
	}

	private listen() {
		return new Promise<void>((resolve, reject) => {
			if (this.config.socket) {
				if (fs.existsSync(this.config.socket)) {
					fs.unlinkSync(this.config.socket);
				}
				this.#honoNodeServer!.listen(this.config.socket, () => {
					if (this.config.chmodSocket) {
						fs.chmodSync(this.config.socket!, this.config.chmodSocket);
					}
					this.logger.info(`Server is listening on socket ${this.config.socket}`);
					resolve();
				});
			} else {
				this.#honoNodeServer!.listen(this.config.port, '0.0.0.0', () => {
					this.logger.info(`Server is listening on port ${this.config.port}`);
					resolve();
				});
			}
		});
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
		if (this.#honoNodeServer != null && this.#honoNodeServer.listening) {
			await new Promise<void>((resolve, reject) => {
				this.#honoNodeServer!.close((err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		}
	}

	@bindThis
	async onApplicationShutdown(signal: string): Promise<void> {
		await this.dispose();
	}
}
