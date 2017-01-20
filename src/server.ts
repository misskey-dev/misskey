/**
 * Core Server
 */

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as cluster from 'cluster';
import * as express from 'express';
import * as morgan from 'morgan';
import vhost = require('vhost');

import config from './conf';

/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');

// Log
app.use(morgan(process.env.NODE_ENV == 'production' ? 'combined' : 'dev', {
	// create a write stream (in append mode)
	stream: config.accesslog ? fs.createWriteStream(config.accesslog) : null
}));

// Drop request that without 'Host' header
app.use((req, res, next) => {
	if (!req.headers['host']) {
		res.sendStatus(400);
	} else {
		next();
	}
});

/**
 * Register modules
 */
app.use(vhost(`api.${config.host}`, require('./api/server')));
app.use(vhost(config.secondary_host, require('./himasaku/server')));
app.use(vhost(`file.${config.secondary_host}`, require('./file/server')));
app.use(require('./web/server'));

/**
 * Create server
 */
const server = config.https.enable ?
	https.createServer({
		key:  fs.readFileSync(config.https.key),
		cert: fs.readFileSync(config.https.cert),
		ca:   fs.readFileSync(config.https.ca)
	}, app) :
	http.createServer(app);

/**
 * Steaming
 */
require('./api/streaming')(server);

/**
 * Server listen
 */
server.listen(config.port, () => {
	if (cluster.isWorker) {
		// Send a 'ready' message to parent process
		process.send('ready');
	}
});

/**
 * Export app for testing
 */
module.exports = app;
