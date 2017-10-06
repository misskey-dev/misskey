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
	type: ['application/json', 'text/plain']
}));
app.use(cors({
	origin: true
}));

app.get('/', (req, res) => {
	res.send('YEE HAW');
});

/**
 * Register endpoint handlers
 */
endpoints.forEach(endpoint =>
	endpoint.withFile ?
		app.post(`/${endpoint.name}`,
			endpoint.withFile ? multer({ dest: 'uploads/' }).single('file') : null,
			require('./api-handler').default.bind(null, endpoint)) :
		app.post(`/${endpoint.name}`,
			require('./api-handler').default.bind(null, endpoint))
);

app.post('/signup', require('./private/signup').default);
app.post('/signin', require('./private/signin').default);

app.use((req, res, next) => {
	// req.headers['cookie'] は常に string ですが、型定義の都合上
	// string | string[] になっているので string を明示しています
	res.locals.user = ((req.headers['cookie'] as string || '').match(/i=(!\w+)/) || [null, null])[1];
	next();
});

require('./service/github')(app);
require('./service/twitter')(app);

require('./bot/interfaces/line')(app);

module.exports = app;
