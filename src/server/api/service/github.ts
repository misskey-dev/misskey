import * as EventEmitter from 'events';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as request from 'request';
import { OAuth2 } from 'oauth';
import User, { IUser, pack, ILocalUser } from '../../../models/user';
import createNote from '../../../services/note/create';
import config from '../../../config';
import { publishMainStream } from '../../../stream';
import redis from '../../../db/redis';
import uuid = require('uuid');
import signin from '../common/signin';
const crypto = require('crypto');

const handler = new EventEmitter();

let bot: IUser;

const post = async (text: string, home = true) => {
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

	createNote(bot, { text, visibility: home ? 'home' : 'public' });
};

function getUserToken(ctx: Koa.Context) {
	return ((ctx.headers['cookie'] || '').match(/i=(!\w+)/) || [null, null])[1];
}

function compareOrigin(ctx: Koa.Context) {
	function normalizeUrl(url: string) {
		return url ? url.endsWith('/') ? url.substr(0, url.length - 1) : url : '';
	}

	const referer = ctx.headers['referer'];

	return (normalizeUrl(referer) == normalizeUrl(config.url));
}

// Init router
const router = new Router();

router.get('/disconnect/github', async ctx => {
	if (!compareOrigin(ctx)) {
		ctx.throw(400, 'invalid origin');
		return;
	}

	const userToken = getUserToken(ctx);
	if (!userToken) {
		ctx.throw(400, 'signin required');
		return;
	}

	const user = await User.findOneAndUpdate({
		host: null,
		'token': userToken
	}, {
		$set: {
			'github': null
		}
	});

	ctx.body = `GitHubの連携を解除しました :v:`;

	// Publish i updated event
	publishMainStream(user._id, 'meUpdated', await pack(user, user, {
		detail: true,
		includeSecrets: true
	}));
});

if (!config.github || !redis) {
	router.get('/connect/github', ctx => {
		ctx.body = '現在GitHubへ接続できません (このインスタンスではGitHubはサポートされていません)';
	});

	router.get('/signin/github', ctx => {
		ctx.body = '現在GitHubへ接続できません (このインスタンスではGitHubはサポートされていません)';
	});
} else {
	const oauth2 = new OAuth2(
		config.github.client_id,
		config.github.client_secret,
		'https://github.com/',
		'login/oauth/authorize',
		'login/oauth/access_token');

	router.get('/connect/github', async ctx => {
		if (!compareOrigin(ctx)) {
			ctx.throw(400, 'invalid origin');
			return;
		}

		const userToken = getUserToken(ctx);
		if (!userToken) {
			ctx.throw(400, 'signin required');
			return;
		}

		const params = {
			redirect_uri: `${config.url}/api/gh/cb`,
			scope: ['read:user'],
			state: uuid()
		};

		redis.set(userToken, JSON.stringify(params));
		ctx.redirect(oauth2.getAuthorizeUrl(params));
	});

	router.get('/signin/github', async ctx => {
		const sessid = uuid();

		const params = {
			redirect_uri: `${config.url}/api/gh/cb`,
			scope: ['read:user'],
			state: uuid()
		};

		const expires = 1000 * 60 * 60; // 1h
		ctx.cookies.set('signin_with_github_session_id', sessid, {
			path: '/',
			domain: config.host,
			secure: config.url.startsWith('https'),
			httpOnly: true,
			expires: new Date(Date.now() + expires),
			maxAge: expires
		});

		redis.set(sessid, JSON.stringify(params));
		ctx.redirect(oauth2.getAuthorizeUrl(params));
	});

	router.get('/gh/cb', async ctx => {
		const userToken = getUserToken(ctx);

		if (!userToken) {
			const sessid = ctx.cookies.get('signin_with_github_session_id');

			if (!sessid) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const code = ctx.query.code;

			if (!code) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const { redirect_uri, state } = await new Promise<any>((res, rej) => {
				redis.get(sessid, async (_, state) => {
					res(JSON.parse(state));
				});
			});

			if (ctx.query.state !== state) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const { accessToken } = await new Promise<any>((res, rej) =>
				oauth2.getOAuthAccessToken(
					code,
					{ redirect_uri },
					(err, accessToken, refresh, result) => {
						if (err)
							rej(err);
						else if (result.error)
							rej(result.error);
						else
							res({ accessToken });
					}));

			const { login, id } = await new Promise<any>((res, rej) =>
				request({
					url: 'https://api.github.com/user',
					headers: {
						'Accept': 'application/vnd.github.v3+json',
						'Authorization': `bearer ${accessToken}`,
						'User-Agent': config.user_agent
					}
				}, (err, response, body) => {
					if (err)
						rej(err);
					else
						res(JSON.parse(body));
				}));

			if (!login || !id) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const user = await User.findOne({
				host: null,
				'github.id': id
			}) as ILocalUser;

			if (!user) {
				ctx.throw(404, `@${login}と連携しているMisskeyアカウントはありませんでした...`);
				return;
			}

			signin(ctx, user, true);
		} else {
			const code = ctx.query.code;

			if (!code) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const { redirect_uri, state } = await new Promise<any>((res, rej) => {
				redis.get(userToken, async (_, state) => {
					res(JSON.parse(state));
				});
			});

			if (ctx.query.state !== state) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const { accessToken } = await new Promise<any>((res, rej) =>
				oauth2.getOAuthAccessToken(
					code,
					{ redirect_uri },
					(err, accessToken, refresh, result) => {
						if (err)
							rej(err);
						else if (result.error)
							rej(result.error);
						else
							res({ accessToken });
					}));

			const { login, id } = await new Promise<any>((res, rej) =>
				request({
					url: 'https://api.github.com/user',
					headers: {
						'Accept': 'application/vnd.github.v3+json',
						'Authorization': `bearer ${accessToken}`,
						'User-Agent': config.user_agent
					}
				}, (err, response, body) => {
					if (err)
						rej(err);
					else
						res(JSON.parse(body));
				}));

			if (!login || !id) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const user = await User.findOneAndUpdate({
				host: null,
				token: userToken
			}, {
				$set: {
					github: {
						accessToken,
						id,
						login
					}
				}
			});

			ctx.body = `GitHub: @${login} を、Misskey: @${user.username} に接続しました！`;

			// Publish i updated event
			publishMainStream(user._id, 'meUpdated', await pack(user, user, {
				detail: true,
				includeSecrets: true
			}));
		}
	});
}

if (config.github_bot) {
	const secret = config.github_bot.hook_secret;

	router.post('/hooks/github', ctx => {
		const body = JSON.stringify(ctx.request.body);
		const hash = crypto.createHmac('sha1', secret).update(body).digest('hex');
		const sig1 = new Buffer(ctx.headers['x-hub-signature']);
		const sig2 = new Buffer(`sha1=${hash}`);

		// シグネチャ比較
		if (sig1.equals(sig2)) {
			handler.emit(ctx.headers['x-github-event'], ctx.request.body);
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
				proxy: config.proxy,
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
			const commits: any[] = event.commits;
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
	post(`(((⭐️))) Starred by **${sender.login}** (((⭐️)))`, false);
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
