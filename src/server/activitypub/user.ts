import * as express from 'express';
import config from '../../conf';
import context from '../../common/remote/activitypub/renderer/context';
import render from '../../common/remote/activitypub/renderer/person';
import withUser from './with-user';

const respond = withUser(username => `${config.url}/@${username}`, (user, req, res) => {
	const rendered = render(user);
	rendered['@context'] = context;

	res.json(rendered);
});

const app = express();
app.disable('x-powered-by');

app.get('/@:user', (req, res, next) => {
	const accepted = req.accepts(['html', 'application/activity+json', 'application/ld+json']);

	if ((['application/activity+json', 'application/ld+json'] as any[]).includes(accepted)) {
		respond(req, res, next);
	} else {
		next();
	}
});

export default app;
