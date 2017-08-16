/**
 * Himasaku Server
 */

import * as express from 'express';
import config from '../conf';

/**
 * Init app
 */
const app = express();

app.disable('x-powered-by');
app.locals.cache = true;

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

app.get('/himasaku.png', (req, res) => {
	res.sendFile(`${__dirname}/assets/himasaku.png`);
});

app.get('*', (req, res) => {
	res.sendFile(`${__dirname}/assets/index.html`);
});

module.exports = app;
