import config from '../config';
import parseAcct from '../acct/parse';
import User from '../models/user';
const express = require('express');

const app = express();

app.get('/.well-known/webfinger', async (req, res) => {
	if (typeof req.query.resource !== 'string') {
		return res.sendStatus(400);
	}

	const resourceLower = req.query.resource.toLowerCase();
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
		return res.sendStatus(422);
	}

	const user = await User.findOne({ usernameLower: parsedAcctLower.username, host: null });
	if (user === null) {
		return res.sendStatus(404);
	}

	return res.json({
		subject: `acct:${user.username}@${config.host}`,
		links: [
			{
				rel: 'self',
				type: 'application/activity+json',
				href: `${config.url}/@${user.username}`
			}
		]
	});
});

export default app;
