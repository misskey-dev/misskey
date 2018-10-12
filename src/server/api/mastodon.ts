import * as Router from 'koa-router';
import User from '../../models/user';
import { toASCII } from 'punycode';

// Init router
const router = new Router();

router.get('/v1/instance/peers', async ctx => {
	const peers = await User.distinct('host', { host: { $ne: null } }) as any as string[];
	const punyCodes = peers.map(peer => toASCII(peer));
	ctx.body = punyCodes;
});

module.exports = router;
