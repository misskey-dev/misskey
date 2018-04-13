import * as Router from 'koa-router';

import config from '../config';
import parseAcct from '../acct/parse';
import User from '../models/user';

// Init router
const router = new Router();

router.get('/.well-known/webfinger', async ctx => {
	if (typeof ctx.query.resource !== 'string') {
		ctx.status = 400;
		return;
	}

	const resourceLower = ctx.query.resource.toLowerCase();
	const webPrefix = config.url.toLowerCase() + '/@';
	let acctLower;

	if (resourceLower.startsWith(webPrefix)) {
		acctLower = resourceLower.slice(webPrefix.length);
	} else if (resourceLower.startsWith('acct:')) {
		acctLower = resourceLower.slice('acct:'.length);
	} else {
		acctLower = resourceLower;
	}

	const parsedAcctLower = parseAcct(acctLower);
	if (![null, config.host.toLowerCase()].includes(parsedAcctLower.host)) {
		ctx.status = 422;
		return;
	}

	const user = await User.findOne({
		usernameLower: parsedAcctLower.username,
		host: null
	});

	if (user === null) {
		ctx.status = 404;
		return;
	}

	ctx.body = {
		subject: `acct:${user.username}@${config.host}`,
		links: [{
			rel: 'self',
			type: 'application/activity+json',
			href: `${config.url}/users/${user._id}`
		}, {
			rel: 'http://webfinger.net/rel/profile-page',
			type: 'text/html',
			href: `${config.url}/@${user.username}`
		}, {
			rel: 'http://ostatus.org/schema/1.0/subscribe',
			template: `${config.url}/authorize-follow?acct={uri}`
		}]
	};
});

export default router;
