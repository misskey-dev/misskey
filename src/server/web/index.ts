/**
 * Web Client Server
 */

import ms = require('ms');
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as send from 'koa-send';
import * as favicon from 'koa-favicon';

const client = `${__dirname}/../../client/`;

// Init app
const app = new Koa();

// Serve favicon
app.use(favicon(`${client}/assets/favicon.ico`));

// Common request handler
app.use(async (ctx, next) => {
	// IFrameの中に入れられないようにする
	ctx.set('X-Frame-Options', 'DENY');
	await next();
});

// Init router
const router = new Router();

//#region static assets

router.get('/assets/*', async ctx => {
	await send(ctx, ctx.path, {
		root: client,
		maxage: ms('7 days'),
		immutable: true
	});
});

// Apple touch icon
router.get('/apple-touch-icon.png', async ctx => {
	await send(ctx, `${client}/assets/apple-touch-icon.png`);
});

// ServiceWroker
router.get(/^\/sw\.(.+?)\.js$/, async ctx => {
	await send(ctx, `${client}/assets/sw.${ctx.params[0]}.js`);
});

// Manifest
router.get('/manifest.json', async ctx => {
	await send(ctx, `${client}/assets/manifest.json`);
});

//#endregion

// Docs
router.use('/docs', require('./docs').routes());

// URL preview endpoint
router.get('url', require('./url-preview'));

// Render base html for all requests
router.get('*', async ctx => {
	await send(ctx, `app/base.html`, {
		root: client,
		maxage: ms('3 days'),
		immutable: true
	});
});

// Register router
app.use(router.routes());

module.exports = app;
