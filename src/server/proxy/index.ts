/**
 * Media Proxy
 */

import * as Koa from 'koa';
import * as cors from '@koa/cors';
import * as Router from '@koa/router';
import { proxyMedia } from './proxy-media';

// Init app
const app = new Koa();
app.use(cors());

// Init router
const router = new Router();

router.get('/:url*', proxyMedia);

// Register router
app.use(router.routes());

module.exports = app;
