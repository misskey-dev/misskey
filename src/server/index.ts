/**
 * Core Server
 */

import * as fs from 'fs';
import * as http from 'http';
import * as http2 from 'http2';
import * as zlib from 'zlib';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as mount from 'koa-mount';
import * as compress from 'koa-compress';
import * as logger from 'koa-logger';
const requestStats = require('request-stats');
//const slow = require('koa-slow');

import activityPub from './activitypub';
import webFinger from './webfinger';
import config from '../config';
import { updateNetworkStats } from '../services/update-chart';
import apiServer from './api';

// Init app
const app = new Koa();
app.proxy = true;

if (process.env.NODE_ENV != 'production') {
	// Logger
	app.use(logger());

	// Delay
	//app.use(slow({
	//	delay: 1000
	//}));
}

// Compress response
app.use(compress({
	flush: zlib.constants.Z_SYNC_FLUSH
}));

// HSTS
// 6months (15552000sec)
if (config.url.startsWith('https')) {
	app.use(async (ctx, next) => {
		ctx.set('strict-transport-security', 'max-age=15552000; preload');
		await next();
	});
}

app.use(mount('/api', apiServer));
app.use(mount('/files', require('./file')));

// Init router
const router = new Router();

// Routing
router.use(activityPub.routes());
router.use(webFinger.routes());

// Register router
app.use(router.routes());

app.use(mount(require('./web')));

function createServer() {
	if (config.https) {
		const certs: any = {};
		Object.keys(config.https).forEach(k => {
			certs[k] = fs.readFileSync(config.https[k]);
		});
		certs['allowHTTP1'] = true;
		return http2.createSecureServer(certs, app.callback());
	} else {
		return http.createServer(app.callback());
	}
}

export default () => new Promise(resolve => {
	const server = createServer();

	// Init stream server
	require('./api/streaming')(server);

	// Listen
	server.listen(config.port, resolve);

	//#region Network stats
	let queue: any[] = [];

	requestStats(server, (stats: any) => {
		if (stats.ok) {
			queue.push(stats);
		}
	});

	// Bulk write
	setInterval(() => {
		if (queue.length == 0) return;

		const requests = queue.length;
		const time = queue.reduce((a, b) => a + b.time, 0);
		const incomingBytes = queue.reduce((a, b) => a + b.req.bytes, 0);
		const outgoingBytes = queue.reduce((a, b) => a + b.res.bytes, 0);
		queue = [];

		updateNetworkStats(requests, time, incomingBytes, outgoingBytes);
	}, 5000);
	//#endregion
});
