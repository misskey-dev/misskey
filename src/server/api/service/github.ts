import * as EventEmitter from 'events';
import * as Router from 'koa-router';
import * as request from 'request';
const crypto = require('crypto');

import User, { IUser } from '../../../models/user';
import createNote from '../../../services/note/create';
import config from '../../../config';

const handler = new EventEmitter();

let bot: IUser;

const post = async text => {
	if (bot == null) {
		const account = await User.findOne({
			usernameLower: config.github_bot.username.toLowerCase()
		});

		if (account == null) {
			console.warn(`GitHub hook bot specified, but not found: @${config.github_bot.username}`);
			return;
		} else {
			bot = account;
		}
	}

	createNote(bot, { text });
};

// Init router
const router = new Router();

if (config.github_bot != null) {
	const secret = config.github_bot.hook_secret;

	router.post('/hooks/github', ctx => {
		const sig1 = new Buffer(ctx.headers['x-hub-signature']);
		const sig2 = new Buffer(`sha1=${crypto.createHmac('sha1', secret).update(JSON.stringify(ctx.body)).digest('hex')}`);
		if (sig1.equals(sig2)) {
			handler.emit(ctx.headers['x-github-event'], ctx.body);
			ctx.status = 204;
		} else {
			ctx.status = 400;
		}
	});
}

module.exports = router;

handler.on('status', event => {
	const state = event.state;
	switch (state) {
		case 'error':
		case 'failure':
			const commit = event.commit;
			const parent = commit.parents[0];

			// Fetch parent status
			request({
				url: `${parent.url}/statuses`,
				headers: {
					'User-Agent': 'misskey'
				}
			}, (err, res, body) => {
				if (err) {
					console.error(err);
					return;
				}
				const parentStatuses = JSON.parse(body);
				const parentState = parentStatuses[0].state;
				const stillFailed = parentState == 'failure' || parentState == 'error';
				if (stillFailed) {
					post(`**⚠️BUILD STILL FAILED⚠️**: ?[${commit.commit.message}](${commit.html_url})`);
				} else {
					post(`**🚨BUILD FAILED🚨**: →→→?[${commit.commit.message}](${commit.html_url})←←←`);
				}
			});
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
