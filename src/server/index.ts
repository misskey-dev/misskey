/**
 * Core Server
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as bodyParser from 'koa-bodyparser';
import * as mount from 'koa-mount';

import activityPub from './activitypub';
import webFinger from './webfinger';
import config from '../config';

// Init app
const app = new Koa();
app.proxy = true;
app.use(bodyParser);

// HSTS
// 6months (15552000sec)
if (config.url.startsWith('https')) {
	app.use((ctx, next) => {
		ctx.set('strict-transport-security', 'max-age=15552000; preload');
		next();
	});
}

app.use(mount('/api', require('./api')));
app.use(mount('/files', require('./file')));

// Init router
const router = new Router();

// Routing
router.use(activityPub.routes());
router.use(webFinger.routes());

app.use(mount(require('./web')));

// Register router
app.use(router.routes());

function createServer() {
	if (config.https) {
		const certs = {};
		Object.keys(config.https).forEach(k => {
			certs[k] = fs.readFileSync(config.https[k]);
		});
		return https.createServer(certs, app.callback);
	} else {
		return http.createServer(app.callback);
	}
}

export default () => new Promise(resolve => {
	const server = createServer();

	/**
	 * Steaming
	 */
	require('./api/streaming')(server);

	/**
	 * Server listen
	 */
	server.listen(config.port, resolve);
});
