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
import networkChart from '../chart/network';
import apiServer from './api';
import { sum } from '../prelude/array';
import User from '../models/user';

// Init app
const app = new Koa();
app.proxy = true;

if (!['production', 'test'].includes(process.env.NODE_ENV)) {
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
if (config.url.startsWith('https') && !config.disableHsts) {
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

router.get('/verify-email/:code', async ctx => {
	const user = await User.findOne({ emailVerifyCode: ctx.params.code });

	if (user != null) {
		ctx.body = 'Verify succeeded!';
		ctx.status = 200;

		User.update({ _id: user._id }, {
			$set: {
				emailVerified: true,
				emailVerifyCode: null
			}
		});
	} else {
		ctx.status = 404;
	}
});

// Return 404 for other .well-known
router.all('/.well-known/*', async ctx => {
	ctx.status = 404;
});

// Register router
app.use(router.routes());

app.use(mount(require('./web')));

function createServer() {
	if (config.https) {
		const certs: any = {};
		for (const k of Object.keys(config.https)) {
			certs[k] = fs.readFileSync(config.https[k]);
		}
		certs['allowHTTP1'] = true;
		return http2.createSecureServer(certs, app.callback());
	} else {
		return http.createServer(app.callback());
	}
}

// For testing
export const startServer = () => {
	const server = createServer();

	// Init stream server
	require('./api/streaming')(server);

	// Listen
	server.listen(config.port);

	return server;
};

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
		const time = sum(queue.map(x => x.time));
		const incomingBytes = sum(queue.map(x => x.req.byets));
		const outgoingBytes = sum(queue.map(x => x.res.byets));
		queue = [];

		networkChart.update(requests, time, incomingBytes, outgoingBytes);
	}, 5000);
	//#endregion
});
