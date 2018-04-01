import * as express from 'express';
import config from '../../conf';
import context from '../../common/remote/activitypub/renderer/context';
import render from '../../common/remote/activitypub/renderer/person';
import parseAcct from '../../common/user/parse-acct';
import User from '../../models/user';

const app = express();
app.disable('x-powered-by');

app.get('/@:user', async (req, res, next) => {
	const accepted = req.accepts(['html', 'application/activity+json', 'application/ld+json']);
	if (!(['application/activity+json', 'application/ld+json'] as Array<any>).includes(accepted)) {
		return next();
	}

	const { username, host } = parseAcct(req.params.user);
	if (host !== null) {
		return res.sendStatus(422);
	}

	const user = await User.findOne({
		usernameLower: username.toLowerCase(),
		host: null
	});
	if (user === null) {
		return res.sendStatus(404);
	}

	if (username !== user.username) {
		return res.redirect(`${config.url}/@${user.username}`);
	}

	const rendered = render(user);
	rendered['@context'] = context;

	res.json(rendered);
});

export default app;
