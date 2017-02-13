/**
 * Web Server
 */

import ms = require('ms');

// express modules
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as favicon from 'serve-favicon';
import * as compression from 'compression';
const subdomain = require('subdomain');
import serveApp from './serve-app';

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
 * Static resources
 */
app.use(favicon(`${__dirname}/resources/favicon.ico`));
app.get('/manifest.json', (req, res) => res.sendFile(__dirname + '/resources/manifest.json'));
app.get('/apple-touch-icon.png', (req, res) => res.sendFile(__dirname + '/resources/apple-touch-icon.png'));
app.use('/_/resources', express.static(`${__dirname}/resources`, {
	maxAge: ms('7 days')
}));

/**
 * Common API
 */
app.get(/\/api:meta/, require('./meta'));
app.get(/\/api:url/,  require('./service/url-preview'));
app.post(/\/api:rss/, require('./service/rss-proxy'));

/**
 * Subdomain
 */
app.use(subdomain({
	base: config.host,
	prefix: '@'
}));

/**
 * Routing
 */
app.use(require('./about')); // about docs
app.get('/@/auth/*', serveApp('auth')); // authorize form
app.get('/@/dev/*',  serveApp('dev')); // developer center
app.get('*',         serveApp('client')); // client

module.exports = app;
