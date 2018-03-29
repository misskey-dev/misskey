/**
 * Web Client Server
 */

import * as path from 'path';
import ms = require('ms');

// express modules
import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as favicon from 'serve-favicon';
import * as compression from 'compression';

const client = `${__dirname}/../../client/`;

// Create server
const app = express();
app.disable('x-powered-by');

app.use('/docs', require('./docs'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
	type: ['application/json', 'text/plain']
}));
app.use(compression());

app.use((req, res, next) => {
	res.header('X-Frame-Options', 'DENY');
	next();
});

//#region static assets

app.use(favicon(`${client}/assets/favicon.ico`));
app.get('/apple-touch-icon.png', (req, res) => res.sendFile(`${client}/assets/apple-touch-icon.png`));
app.use('/assets', express.static(`${client}/assets`, {
	maxAge: ms('7 days')
}));
app.use('/assets/*.js', (req, res) => res.sendFile(`${client}/assets/404.js`));
app.use('/assets', (req, res) => {
	res.sendStatus(404);
});

app.use('/recover', (req, res) => res.sendFile(`${client}/assets/recover.html`));

// ServiceWroker
app.get(/^\/sw\.(.+?)\.js$/, (req, res) =>
	res.sendFile(`${client}/assets/sw.${req.params[0]}.js`));

// Manifest
app.get('/manifest.json', (req, res) =>
	res.sendFile(`${client}/assets/manifest.json`));

//#endregion

app.get(/\/api:url/, require('./url-preview'));

// Render base html for all requests
app.get('*', (req, res) => {
	res.sendFile(path.resolve(`${client}/app/base.html`), {
		maxAge: ms('7 days')
	});
});

module.exports = app;
