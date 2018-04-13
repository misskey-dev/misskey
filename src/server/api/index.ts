/**
 * API Server
 */

import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as multer from 'koa-multer';
import * as bodyParser from 'koa-bodyparser';

import endpoints from './endpoints';

const handler = require('./api-handler').default;

// Init app
const app = new Koa();
app.use(bodyParser({
	detectJSON: () => true
}));

// Init multer instance
const upload = multer({
	storage: multer.diskStorage({})
});

// Init router
const router = new Router();

/**
 * Register endpoint handlers
 */
endpoints.forEach(endpoint => endpoint.withFile
	? router.post(`/${endpoint.name}`, upload.single('file'), handler.bind(null, endpoint))
	: router.post(`/${endpoint.name}`, handler.bind(null, endpoint))
);

router.post('/signup', require('./private/signup').default);
router.post('/signin', require('./private/signin').default);

router.use(require('./service/github').routes());
router.use(require('./service/twitter').routes());
router.use(require('./bot/interfaces/line').routes());

// Register router
app.use(router.routes());

module.exports = app;
