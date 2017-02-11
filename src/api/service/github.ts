import * as EventEmitter from 'events';
import * as express from 'express';
const crypto = require('crypto');
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

	const handler = new EventEmitter();

	app.post('/hooks/github', (req, res, next) => {
		if ((new Buffer(req.headers['x-hub-signature'])).equals(new Buffer('sha1=' + crypto.createHmac('sha1', config.github_bot.hook_secret).update(JSON.stringify(req.body)).digest('hex')))) {
			handler.emit(req.headers['x-github-event'], req.body);
		} else {
			res.sendStatus(400);
		}
	});

	handler.on('push', event => {
		const ref = event.ref;
		if (ref != 'refs/heads/master') return;
		const pusher = event.pusher;
		const compare = event.compare;
		post(`Pushed! (Pusher: ${pusher.name})\nCompare changes: ${compare}`);
	});

	handler.on('issues', event => {
		const issue = event.issue;
		const action = event.action;
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
		const issue = event.issue;
		const comment = event.comment;
		const action = event.action;
		let text: string;
		switch (action) {
			case 'created': text = `Comment to「${issue.title}」:${comment.user.login}「${comment.body}」\n${comment.html_url}`; break;
			default: return;
		}
		post(text);
	});

	handler.on('started', event => {
		const sender = event.sender;
		post(`⭐️Started by ${sender.login}`);
	});

	handler.on('fork', event => {
		const repo = event.forkee;
		post(`🍴Forked:\n${repo.html_url}`);
	});

	handler.on('pull_request', event => {
		const pr = event.pull_request;
		const action = event.action;
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
