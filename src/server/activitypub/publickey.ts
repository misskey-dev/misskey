import * as express from 'express';
import context from '../../remote/activitypub/renderer/context';
import render from '../../remote/activitypub/renderer/key';
import config from '../../conf';
import withUser from './with-user';

const app = express();
app.disable('x-powered-by');

app.get('/@:user/publickey', withUser(username => {
	return `${config.url}/@${username}/publickey`;
}, (user, req, res) => {
	const rendered = render(user);
	rendered['@context'] = context;

	res.json(rendered);
}));

export default app;
