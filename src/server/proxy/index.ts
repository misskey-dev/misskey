/**
 * Media Proxy
 */

import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as Router from '@koa/router';
import { proxyMedia } from './proxy-media';

// Init app
const app = new Koa();
app.use(cors());
app.use(async (ctx, next) => {
	ctx.set('Content-Security-Policy', `default-src 'none'; style-src 'unsafe-inline'`);
	await next();
});

// Init router
const router = new Router();

router.get('/:url*', proxyMedia);

// Register router
app.use(router.routes());

module.exports = app;
