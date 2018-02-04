/**
 * Docs Server
 */

import * as express from 'express';

/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');

app.use('/assets', express.static(`${__dirname}/assets`));

/**
 * Routing
 */
app.get(/^\/([a-z_\-\/]+?)$/, (req, res) =>
	res.sendFile(`${__dirname}/${req.params[0]}.html`));

module.exports = app;
