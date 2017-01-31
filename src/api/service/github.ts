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

	handler.on('push', event => {
		const ref = event.payload.ref;
		if (ref != 'refs/heads/master') return;
		const pusher = event.payload.pusher;
		const compare = event.payload.compare;
		post(`Pushed! (Pusher: ${pusher.name})\nCompare changes: ${compare}`);
	});

	handler.on('issues', event => {
		const issue = event.payload.issue;
		const action = event.payload.action;
		let title: string;
		switch (action) {
			case 'opened': title = 'New Issue'; break;
			case 'closed': title = 'Issue Closed'; break;
			case 'reopened': title = 'Issue Reopened'; break;
			default: return;
		}
		post(`${title}: ${issue.number}「${issue.title}」\n${issue.html_url}`);
	});

	handler.on('issue_comment', event => {
		const issue = event.payload.issue;
		const comment = event.payload.comment;
		const action = event.payload.action;
		let text: string;
		switch (action) {
			case 'created': text = `Comment to「${issue.title}」:${comment.user.login}「${comment.body}」\n${comment.html_url}`; break;
			default: return;
		}
		post(text);
	});

	handler.on('fork', event => {
		const repo = event.payload.forkee;
		post(`Forked:\n${repo.html_url}`);
	});

	handler.on('pull_request', event => {
		const pr = event.payload.pull_request;
		const action = event.payload.action;
		let text: string;
		switch (action) {
			case 'opened': text = `New Pull Request:「${pr.title}」\n${pr.html_url}`; break;
			case 'reopened': text = `Pull Request Reopened:「${pr.title}」\n${pr.html_url}`; break;
			case 'closed':
				text = pr.merged
					? `Pull Request Merged!:「${pr.title}」\n${pr.html_url}`
					: `Pull Request Closed:「${pr.title}」\n${pr.html_url}`;
				break;
			default: return;
		}
		post(text);
	});
};
