/**
 * Docs
 */

import ms = require('ms');
import * as Router from 'koa-router';
import * as send from 'koa-send';

const docs = `${__dirname}/../../client/docs/`;

const router = new Router();

router.get('/assets/*', async ctx => {
	await send(ctx, ctx.params[0], {
		root: docs + '/assets/',
		maxage: ms('7 days'),
		immutable: true
	});
});

router.get('*', async ctx => {
	await send(ctx, `${ctx.params[0]}.html`, {
		root: docs
	});
});

export default router;
