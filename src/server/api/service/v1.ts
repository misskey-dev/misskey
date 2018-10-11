import * as Router from 'koa-router';
import User from '../../../models/user';

// Init router
const router = new Router();

router.get('/v1/instance/peers', async ctx => {
	const peers = await User.distinct('host', { host: { $ne: null } });
	ctx.set('Cache-Control', 'public, max-age=3600');
	ctx.body = peers;
});

module.exports = router;
