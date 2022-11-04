import cluster from 'node:cluster';
import * as fs from 'node:fs';
import * as http from 'node:http';
import { Inject, Injectable } from '@nestjs/common';
import Koa from 'koa';
import Router from '@koa/router';
import mount from 'koa-mount';
import koaLogger from 'koa-logger';
import * as slow from 'koa-slow';
import { IsNull } from 'typeorm';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { Config } from '@/config.js';
import type { UserProfilesRepository, UsersRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import { envOption } from '@/env.js';
import * as Acct from '@/misc/acct.js';
import { genIdenticon } from '@/misc/gen-identicon.js';
import { createTemp } from '@/misc/create-temp.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { ActivityPubServerService } from './ActivityPubServerService.js';
import { NodeinfoServerService } from './NodeinfoServerService.js';
import { ApiServerService } from './api/ApiServerService.js';
import { StreamingApiServerService } from './api/StreamingApiServerService.js';
import { WellKnownServerService } from './WellKnownServerService.js';
import { MediaProxyServerService } from './MediaProxyServerService.js';
import { FileServerService } from './FileServerService.js';
import { ClientServerService } from './web/ClientServerService.js';

@Injectable()
export class ServerService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private apiServerService: ApiServerService,
		private streamingApiServerService: StreamingApiServerService,
		private activityPubServerService: ActivityPubServerService,
		private wellKnownServerService: WellKnownServerService,
		private nodeinfoServerService: NodeinfoServerService,
		private fileServerService: FileServerService,
		private mediaProxyServerService: MediaProxyServerService,
		private clientServerService: ClientServerService,
		private globalEventService: GlobalEventService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('server', 'gray', false);
	}

	public launch() {
		// Init app
		const koa = new Koa();
		koa.proxy = true;

		if (!['production', 'test'].includes(process.env.NODE_ENV ?? '')) {
		// Logger
			koa.use(koaLogger(str => {
				this.logger.info(str);
			}));

			// Delay
			if (envOption.slow) {
				koa.use(slow({
					delay: 3000,
				}));
			}
		}

		// HSTS
		// 6months (15552000sec)
		if (this.config.url.startsWith('https') && !this.config.disableHsts) {
			koa.use(async (ctx, next) => {
				ctx.set('strict-transport-security', 'max-age=15552000; preload');
				await next();
			});
		}

		koa.use(mount('/api', this.apiServerService.createApiServer(koa)));
		koa.use(mount('/files', this.fileServerService.createServer()));
		koa.use(mount('/proxy', this.mediaProxyServerService.createServer()));

		// Init router
		const router = new Router();

		// Routing
		router.use(this.activityPubServerService.createRouter().routes());
		router.use(this.nodeinfoServerService.createRouter().routes());
		router.use(this.wellKnownServerService.createRouter().routes());

		router.get('/avatar/@:acct', async ctx => {
			const { username, host } = Acct.parse(ctx.params.acct);
			const user = await this.usersRepository.findOne({
				where: {
					usernameLower: username.toLowerCase(),
					host: (host == null) || (host === this.config.host) ? IsNull() : host,
					isSuspended: false,
				},
				relations: ['avatar'],
			});

			if (user) {
				ctx.redirect(this.userEntityService.getAvatarUrlSync(user));
			} else {
				ctx.redirect('/static-assets/user-unknown.png');
			}
		});

		router.get('/identicon/:x', async ctx => {
			const [temp, cleanup] = await createTemp();
			await genIdenticon(ctx.params.x, fs.createWriteStream(temp));
			ctx.set('Content-Type', 'image/png');
			ctx.body = fs.createReadStream(temp).on('close', () => cleanup());
		});

		router.get('/verify-email/:code', async ctx => {
			const profile = await this.userProfilesRepository.findOneBy({
				emailVerifyCode: ctx.params.code,
			});

			if (profile != null) {
				ctx.body = 'Verify succeeded!';
				ctx.status = 200;

				await this.userProfilesRepository.update({ userId: profile.userId }, {
					emailVerified: true,
					emailVerifyCode: null,
				});

				this.globalEventService.publishMainStream(profile.userId, 'meUpdated', await this.userEntityService.pack(profile.userId, { id: profile.userId }, {
					detail: true,
					includeSecrets: true,
				}));
			} else {
				ctx.status = 404;
			}
		});

		// Register router
		koa.use(router.routes());

		koa.use(mount(this.clientServerService.createApp()));

		const server = http.createServer(koa.callback());

		this.streamingApiServerService.attachStreamingApi(server);

		server.on('error', err => {
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
			// disableClustering
				process.exit(1);
			}
		});

		server.listen(this.config.port);
	}
}
