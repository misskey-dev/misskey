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
 * HSTS
 * 6month(15552000sec)
 */
if(config.https.enable){
	app.use((req, res, next) => {
		res.header('strict-transport-security', 'max-age=15552000; preload');
		next();
	});
}

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
app.get('/manifest.json', (req, res) => res.sendFile(`${__dirname}/assets/manifest.json`));
app.get('/apple-touch-icon.png', (req, res) => res.sendFile(`${__dirname}/assets/apple-touch-icon.png`));
app.use('/assets', express.static(`${__dirname}/assets`, {
	maxAge: ms('7 days')
}));

/**
 * Common API
 */
app.get(/\/api:url/, require('./service/url-preview'));

/**
 * Serve config
 */
app.get('/config.json', (req, res) => {
	res.send({
		recaptcha: {
			siteKey: config.recaptcha.siteKey
		}
	});
});

/**
 * Routing
 */
app.get('*', (req, res) => {
	res.sendFile(path.resolve(`${__dirname}/app/base.html`), {
		maxAge: ms('7 days')
	});
});

module.exports = app;
