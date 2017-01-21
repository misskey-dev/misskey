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
app.use(compression());

/**
 * Initialize requests
 */
app.use((req, res, next) => {
	res.header('X-Frame-Options', 'DENY');

	res.locals.user = ((req.headers['cookie'] || '').match(/i=(!\w+)/) || [null, null])[1];

	next();
});

/**
 * Static resources
 */
app.use(favicon(`${__dirname}/resources/favicon.ico`));
app.use(require('./manifest'));
app.use(require('./apple-touch-icon'));
app.use('/_/resources', express.static(`${__dirname}/resources`, {
	maxAge: ms('7 days')
}));

/**
 * Common API
 */
app.get(/\/api:meta/, require('./meta'));
app.get(/\/api:url/,  require('./service/url-preview'));
app.post(/\/api:rss/, require('./service/rss-proxy'));

require('./service/twitter')(app);

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

app.use('/@/about/resources', express.static(`${__dirname}/about/resources`, {
	maxAge: ms('7 days')
}));

app.get('/@/about/', (req, res) => {
	res.sendFile(`${__dirname}/about/pages/index.html`);
});

app.get('/@/about/:page(*)', (req, res) => {
	res.sendFile(`${__dirname}/about/pages/${req.params.page}.html`);
});

app.get('/@/auth/*', serveApp('auth')); // authorize form
app.get('/@/dev/*',  serveApp('dev')); // developer center
app.get('*',         serveApp('client')); // client

module.exports = app;
