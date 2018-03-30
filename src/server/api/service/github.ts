import * as EventEmitter from 'events';
import * as express from 'express';
//const crypto = require('crypto');
import User from '../../../models/user';
import config from '../../../conf';
import queue from '../../../queue';

module.exports = async (app: express.Application) => {
	if (config.github_bot == null) return;

	const bot = await User.findOne({
		usernameLower: config.github_bot.username.toLowerCase(),
		host: null
	});

	if (bot == null) {
		console.warn(`GitHub hook bot specified, but not found: @${config.github_bot.username}`);
		return;
	}

	const post = text => require('../endpoints/posts/create')({ text }, bot);

	const handler = new EventEmitter();

	app.post('/hooks/github', (req, res, next) => {
		// req.headers['x-hub-signature'] および
		// req.headers['x-github-event'] は常に string ですが、型定義の都合上
		// string | string[] になっているので string を明示しています
//		if ((new Buffer(req.headers['x-hub-signature'] as string)).equals(new Buffer(`sha1=${crypto.createHmac('sha1', config.github_bot.hook_secret).update(JSON.stringify(req.body)).digest('hex')}`))) {
			handler.emit(req.headers['x-github-event'] as string, req.body);
			res.sendStatus(200);
//		} else {
//			res.sendStatus(400);
//		}
	});

	handler.on('status', event => {
		const state = event.state;
		switch (state) {
			case 'error':
			case 'failure':
				const commit = event.commit;
				const parent = commit.parents[0];

				queue.create('gitHubFailureReport', {
					userId: bot._id,
					parentUrl: parent.url,
					htmlUrl: commit.html_url,
					message: commit.commit.message,
				}).save();
				break;
		}
	});

	handler.on('push', event => {
		const ref = event.ref;
		switch (ref) {
			case 'refs/heads/master':
				const pusher = event.pusher;
				const compare = event.compare;
				const commits = event.commits;
				post([
					`Pushed by **${pusher.name}** with ?[${commits.length} commit${commits.length > 1 ? 's' : ''}](${compare}):`,
					commits.reverse().map(commit => `・[?[${commit.id.substr(0, 7)}](${commit.url})] ${commit.message.split('\n')[0]}`).join('\n'),
				].join('\n'));
				break;
			case 'refs/heads/release':
				const commit = event.commits[0];
				post(`RELEASED: ${commit.message}`);
				break;
		}
	});

	handler.on('issues', event => {
		const issue = event.issue;
		const action = event.action;
		let title: string;
		switch (action) {
			case 'opened': title = 'Issue opened'; break;
			case 'closed': title = 'Issue closed'; break;
			case 'reopened': title = 'Issue reopened'; break;
			default: return;
		}
		post(`${title}: <${issue.number}>「${issue.title}」\n${issue.html_url}`);
	});

	handler.on('issue_comment', event => {
		const issue = event.issue;
		const comment = event.comment;
		const action = event.action;
		let text: string;
		switch (action) {
			case 'created': text = `Commented to「${issue.title}」:${comment.user.login}「${comment.body}」\n${comment.html_url}`; break;
			default: return;
		}
		post(text);
	});

	handler.on('watch', event => {
		const sender = event.sender;
		post(`⭐️ Starred by **${sender.login}** ⭐️`);
	});

	handler.on('fork', event => {
		const repo = event.forkee;
		post(`🍴 Forked:\n${repo.html_url} 🍴`);
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
