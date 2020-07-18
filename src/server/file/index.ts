/**
 * File Server
 */

import * as fs from 'fs';
import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as Router from '@koa/router';
import sendDriveFile from './send-drive-file';

// Init app
const app = new Koa();
app.use(cors());

// Init router
const router = new Router();

router.get('/app-default.jpg', ctx => {
	const file = fs.createReadStream(`${__dirname}/assets/dummy.png`);
	ctx.body = file;
	ctx.set('Content-Type', 'image/jpeg');
	ctx.set('Cache-Control', 'max-age=31536000, immutable');
});

router.get('/:key', sendDriveFile);
router.get('/:key/(.*)', sendDriveFile);

// Register router
app.use(router.routes());

module.exports = app;
