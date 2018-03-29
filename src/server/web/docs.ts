/**
 * Docs Server
 */

import * as express from 'express';

const docs = `${__dirname}/../../client/docs/`;

/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');

app.use('/assets', express.static(`${docs}/assets`));

/**
 * Routing
 */
app.get(/^\/([a-z_\-\/]+?)$/, (req, res) =>
	res.sendFile(`${docs}/${req.params[0]}.html`));

module.exports = app;
