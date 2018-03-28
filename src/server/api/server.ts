/**
 * API Server
 */

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import * as multer from 'multer';

// import authenticate from './authenticate';
import endpoints from './endpoints';

/**
 * Init app
 */
const app = express();

app.disable('x-powered-by');
app.set('etag', false);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
	type: ['application/json', 'text/plain'],
	verify: (req, res, buf, encoding) => {
		if (buf && buf.length) {
			(req as any).rawBody = buf.toString(encoding || 'utf8');
		}
	}
}));
app.use(cors());

app.get('/', (req, res) => {
	res.send('YEE HAW');
});

/**
 * Register endpoint handlers
 */
endpoints.forEach(endpoint =>
	endpoint.withFile ?
		app.post(`/${endpoint.name}`,
			endpoint.withFile ? multer({ storage: multer.diskStorage({}) }).single('file') : null,
			require('./api-handler').default.bind(null, endpoint)) :
		app.post(`/${endpoint.name}`,
			require('./api-handler').default.bind(null, endpoint))
);

app.post('/signup', require('./private/signup').default);
app.post('/signin', require('./private/signin').default);

require('./service/github')(app);
require('./service/twitter')(app);

require('./bot/interfaces/line')(app);

module.exports = app;
