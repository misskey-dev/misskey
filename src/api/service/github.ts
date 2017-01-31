import * as express from 'express';
const createHandler = require('github-webhook-handler');
import config from '../../conf';

module.exports = (app: express.Application) => {
	if (config.github_bot == null) return;

	const handler = createHandler({
		path: '/hooks/github',
		secret: config.github_bot.hook_secret
	});

	app.post('/hooks/github', handler);

	handler.on('*', event => {
		console.dir(event);
	});
};
