/**
 * Core Server
 */

import cluster from 'node:cluster';
import * as fs from 'node:fs';
import * as http from 'node:http';
import Koa from 'koa';
import Router from '@koa/router';
import mount from 'koa-mount';
import koaLogger from 'koa-logger';
import * as slow from 'koa-slow';
import { IsNull } from 'typeorm';
import Logger from '@/logger.js';
import { UserProfiles, Users } from '@/models/index.js';
import { genIdenticon } from '@/misc/gen-identicon.js';
import { createTemp } from '@/misc/create-temp.js';
import * as Acct from '@/misc/acct.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { Config } from '@/config/types.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { envOption } from '../env.js';
import activityPub from './activitypub.js';
import nodeinfo from './nodeinfo.js';
import wellKnown from './well-known.js';
import { createApiServer } from './api/index.js';
import fileServer from './file/index.js';
import proxyServer from './proxy/index.js';
import webServer from './web/index.js';
import { initializeStreamingServer } from './api/streaming.js';
import type { INestApplicationContext } from '@nestjs/common';

export const serverLogger = new Logger('server', 'gray', false);

export default (app: INestApplicationContext) => new Promise(resolve => {
	const config = app.get<Config>(DI_SYMBOLS.config);
	const globalEventService = app.get(GlobalEventService);

	// Init app
	const koa = new Koa();
	koa.proxy = true;

	if (!['production', 'test'].includes(process.env.NODE_ENV || '')) {
		// Logger
		koa.use(koaLogger(str => {
			serverLogger.info(str);
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
	if (config.url.startsWith('https') && !config.disableHsts) {
		koa.use(async (ctx, next) => {
			ctx.set('strict-transport-security', 'max-age=15552000; preload');
			await next();
		});
	}

	koa.use(mount('/api', createApiServer(app)));
	koa.use(mount('/files', fileServer));
	koa.use(mount('/proxy', proxyServer));

	// Init router
	const router = new Router();

	// Routing
	router.use(activityPub.routes());
	router.use(nodeinfo.routes());
	router.use(wellKnown.routes());

	router.get('/avatar/@:acct', async ctx => {
		const { username, host } = Acct.parse(ctx.params.acct);
		const user = await Users.findOne({
			where: {
				usernameLower: username.toLowerCase(),
				host: (host == null) || (host === config.host) ? IsNull() : host,
				isSuspended: false,
			},
			relations: ['avatar'],
		});

		if (user) {
			ctx.redirect(Users.getAvatarUrlSync(user));
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
		const profile = await UserProfiles.findOneBy({
			emailVerifyCode: ctx.params.code,
		});

		if (profile != null) {
			ctx.body = 'Verify succeeded!';
			ctx.status = 200;

			await UserProfiles.update({ userId: profile.userId }, {
				emailVerified: true,
				emailVerifyCode: null,
			});

			globalEventService.publishMainStream(profile.userId, 'meUpdated', await Users.pack(profile.userId, { id: profile.userId }, {
				detail: true,
				includeSecrets: true,
			}));
		} else {
			ctx.status = 404;
		}
	});

	// Register router
	koa.use(router.routes());

	koa.use(mount(webServer));

	const server = http.createServer(koa.callback());

	initializeStreamingServer(app, server);

	server.on('error', e => {
		switch ((e as any).code) {
			case 'EACCES':
				serverLogger.error(`You do not have permission to listen on port ${config.port}.`);
				break;
			case 'EADDRINUSE':
				serverLogger.error(`Port ${config.port} is already in use by another process.`);
				break;
			default:
				serverLogger.error(e);
				break;
		}

		if (cluster.isWorker) {
			process.send!('listenFailed');
		} else {
			// disableClustering
			process.exit(1);
		}
	});

	server.listen(config.port, resolve);
});
