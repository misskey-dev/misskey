import * as mongo from 'mongodb';
import * as Router from 'koa-router';

import config from '../config';
import parseAcct from '../misc/acct/parse';
import User from '../models/user';
import Acct from '../misc/acct/type';
import { links } from './nodeinfo';

// Init router
const router = new Router();

const webFingerPath = '/.well-known/webfinger';

router.get('/.well-known/host-meta', async ctx => {
	ctx.set('Content-Type', 'application/xrd+xml');
	ctx.body = `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Link rel="lrdd" type="application/xrd+xml" template="${config.url}${webFingerPath}?resource={uri}"/>
</XRD>
`;
});

router.get('/.well-known/host-meta.json', async ctx => {
	ctx.set('Content-Type', 'application/jrd+json');
	ctx.body = {
		links: [{
			rel: 'lrdd',
			type: 'application/xrd+xml',
			template: `${config.url}${webFingerPath}?resource={uri}`
		}]
	};
});

router.get('/.well-known/nodeinfo', async ctx => {
	ctx.body = { links };
});

router.get(webFingerPath, async ctx => {
	const generateQuery = (resource: string) =>
		resource.startsWith(`${config.url.toLowerCase()}/users/`) ?
			fromId(new mongo.ObjectID(resource.split('/').pop())) :
			fromAcct(parseAcct(
				resource.startsWith(`${config.url.toLowerCase()}/@`) ? resource.split('/').pop() :
				resource.startsWith('acct:') ? resource.slice('acct:'.length) :
				resource));

	const fromId = (_id: mongo.ObjectID): Record<string, any> => ({
			_id,
			host: null
		});

	const fromAcct = (acct: Acct): Record<string, any> | number =>
		!acct.host || acct.host === config.host.toLowerCase() ? {
			usernameLower: acct.username,
			host: null
		} : 422;

	if (typeof ctx.query.resource !== 'string') {
		ctx.status = 400;
		return;
	}

	const query = generateQuery(ctx.query.resource.toLowerCase());

	if (typeof query === 'number') {
		ctx.status = query;
		return;
	}

	const user = await User.findOne(query);

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

	ctx.set('Cache-Control', 'public, max-age=180');
});

// Return 404 for other .well-known
router.all('/.well-known/*', async ctx => {
	ctx.status = 404;
});

export default router;
