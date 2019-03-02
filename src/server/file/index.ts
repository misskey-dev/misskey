/**
 * File Server
 */

import * as fs from 'fs';
import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as Router from 'koa-router';
import sendDriveFile from './send-drive-file';

// Init app
const app = new Koa();
app.use(cors());

app.use(async (ctx, next) => {
	// Cache 365days
	ctx.set('Cache-Control', 'max-age=31536000, immutable');
	await next();
});

// Init router
const router = new Router();

router.get('/default-avatar.jpg', ctx => {
	const file = fs.createReadStream(`${__dirname}/assets/avatar.jpg`);
	ctx.set('Content-Type', 'image/jpeg');
	ctx.body = file;
});

router.get('/app-default.jpg', ctx => {
	const file = fs.createReadStream(`${__dirname}/assets/dummy.png`);
	ctx.set('Content-Type', 'image/png');
	ctx.body = file;
});

router.get('/thumbnail-not-available.png', ctx => {
	const file = fs.createReadStream(`${__dirname}/assets/thumbnail-not-available.png`);
	ctx.set('Content-Type', 'image/png');
	ctx.body = file;
});

router.get('/*', sendDriveFile);

// Register router
app.use(router.routes());

module.exports = app;
