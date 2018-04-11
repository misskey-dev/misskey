/**
 * Core Server
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as express from 'express';
import * as morgan from 'morgan';

import activityPub from './activitypub';
import webFinger from './webfinger';
import log from './log-request';
import config from '../config';

/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 'loopback');

app.use(morgan(process.env.NODE_ENV == 'production' ? 'combined' : 'dev', {
	// create a write stream (in append mode)
	stream: config.accesslog ? fs.createWriteStream(config.accesslog) : null
}));

app.use((req, res, next) => {
	log(req);
	next();
});

/**
 * HSTS
 * 6month(15552000sec)
 */
if (config.url.startsWith('https')) {
	app.use((req, res, next) => {
		res.header('strict-transport-security', 'max-age=15552000; preload');
		next();
	});
}

// Drop request when without 'Host' header
app.use((req, res, next) => {
	if (!req.headers['host']) {
		res.sendStatus(400);
	} else {
		next();
	}
});

// 互換性のため
app.post('/meta', (req, res) => {
	res.header('Access-Control-Allow-Origin', '*');
	res.json({
		version: 'nighthike'
	});
});

/**
 * Register modules
 */
app.use('/api', require('./api'));
app.use('/files', require('./file'));
app.use(activityPub);
app.use(webFinger);
app.use(require('./web'));

function createServer() {
	if (config.https) {
		const certs = {};
		Object.keys(config.https).forEach(k => {
			certs[k] = fs.readFileSync(config.https[k]);
		});
		return https.createServer(certs, app);
	} else {
		return http.createServer(app);
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
