/**
 * Web Server
 */

import * as path from 'path';
import ms = require('ms');

// express modules
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as favicon from 'serve-favicon';
import * as compression from 'compression';

import config from '../conf';

/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
	type: ['application/json', 'text/plain']
}));
app.use(compression());

/**
 * Initialize requests
 */
app.use((req, res, next) => {
	res.header('X-Frame-Options', 'DENY');
	next();
});

/**
 * Static assets
 */
app.use(favicon(`${__dirname}/assets/favicon.ico`));
app.get('/apple-touch-icon.png', (req, res) => res.sendFile(`${__dirname}/assets/apple-touch-icon.png`));
app.use('/assets', express.static(`${__dirname}/assets`, {
	maxAge: ms('7 days')
}));

app.get('/sw.js', (req, res) => res.sendFile(`${__dirname}/assets/sw.js`));

/**
 * Manifest
 */
app.get('/manifest.json', (req, res) => {
	const manifest = require((`${__dirname}/assets/manifest.json`));

	// Service Worker
	if (config.sw) {
		manifest['gcm_sender_id'] = config.sw.gcm_sender_id;
	}

	res.send(manifest);
});

/**
 * Serve config
 */
app.get('/config.json', (req, res) => {
	const conf = {
		recaptcha: {
			siteKey: config.recaptcha.siteKey
		}
	};

	res.send(conf);
});

/**
 * Common API
 */
app.get(/\/api:url/, require('./service/url-preview'));

/**
 * Routing
 */
app.get('*', (req, res) => {
	res.sendFile(path.resolve(`${__dirname}/app/base.html`), {
		maxAge: ms('7 days')
	});
});

module.exports = app;
