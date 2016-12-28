/**
 * Forward Proxy Service
 */

import * as express from 'express';
import * as cors from 'cors';

/**
 * Init app
 */
const app = express();
app.disable('x-powered-by');
app.use(cors());

app.get('/:url(*)', require('./proxy'));

module.exports = app;
