import * as express from 'express';
const createHandler = require('github-webhook-handler');
import User from '../models/user';
import config from '../../conf';

module.exports = async (app: express.Application) => {
	if (config.github_bot == null) return;

	const bot = await User.findOne({
		username_lower: config.github_bot.username.toLowerCase()
	});

	if (bot == null) {
		console.warn(`GitHub hook bot specified, but not found: @${config.github_bot.username}`);
		return;
	}

	const post = text => require('../endpoints/posts/create')({ text }, bot);

	const handler = createHandler({
		path: '/hooks/github',
		secret: config.github_bot.hook_secret
	});

	app.post('/hooks/github', handler);

	handler.on('*', event => {
		console.dir(event);
	});

	handler.on('issues', event => {
		const issue = event.payload.issue;
		const action = event.payload.action;
		let title: string;
		switch (action) {
			case 'opened': title = 'Issueが立ちました'; break;
			case 'closed': title = 'Issueが閉じられました'; break;
			case 'reopened': title = 'Issueが開きました'; break;
			default: return;
		}
		post(`${title}: ${issue.number}「${issue.title}」\n${issue.html_url}`);
	});
};
