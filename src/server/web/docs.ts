/**
 * Docs
 */

import * as path from 'path';
import * as Router from 'koa-router';
import * as send from 'koa-send';

const docs = path.resolve(`${__dirname}/../../client/docs/`);

const router = new Router();

router.get('/assets', async ctx => {
	await send(ctx, `${docs}/assets`);
});

router.get(/^\/([a-z_\-\/]+?)$/, async ctx => {
	await send(ctx, `${docs}/${ctx.params[0]}.html`);
});

module.exports = router;
