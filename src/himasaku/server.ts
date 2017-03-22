/**
 * Himasaku Server
 */

import * as express from 'express';

/**
 * Init app
 */
const app = express();

app.disable('x-powered-by');
app.locals.cache = true;

app.get('/himasaku.png', (req, res) => {
	res.sendFile(__dirname + '/assets/himasaku.png');
});

app.get('*', (req, res) => {
	res.sendFile(__dirname + '/assets/index.html');
});

module.exports = app;
