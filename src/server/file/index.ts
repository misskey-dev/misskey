/**
 * File Server
 */

import * as fs from 'fs';
import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as Router from 'koa-router';
import pour from './pour';
import sendDriveFile from './send-drive-file';

// Init app
const app = new Koa();
app.use(cors());

app.use(async (ctx, next) => {
	ctx.set('Cache-Control', 'max-age=31536000, immutable');
	await next();
});

// Init router
const router = new Router();

router.get('/default-avatar.jpg', ctx => {
	const file = fs.createReadStream(`${__dirname}/assets/avatar.jpg`);
	pour(file, 'image/jpeg', ctx);
});

router.get('/app-default.jpg', ctx => {
	const file = fs.createReadStream(`${__dirname}/assets/dummy.png`);
	pour(file, 'image/png', ctx);
});

router.get('/:id', sendDriveFile);
router.get('/:id/*', sendDriveFile);

// Register router
app.use(router.routes());

module.exports = app;
