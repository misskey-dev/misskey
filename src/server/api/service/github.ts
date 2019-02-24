import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as request from 'request';
import { OAuth2 } from 'oauth';
import User, { pack, ILocalUser } from '../../../models/user';
import config from '../../../config';
import { publishMainStream } from '../../../services/stream';
import redis from '../../../db/redis';
import * as uuid from 'uuid';
import signin from '../common/signin';
import fetchMeta from '../../../misc/fetch-meta';

function getUserToken(ctx: Koa.BaseContext) {
	return ((ctx.headers['cookie'] || '').match(/i=(!\w+)/) || [null, null])[1];
}

function compareOrigin(ctx: Koa.BaseContext) {
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

async function getOath2() {
	const meta = await fetchMeta();

	if (meta.enableGithubIntegration) {
		return new OAuth2(
			meta.githubClientId,
			meta.githubClientSecret,
			'https://github.com/',
			'login/oauth/authorize',
			'login/oauth/access_token');
	} else {
		return null;
	}
}

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

	const oauth2 = await getOath2();
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

	const oauth2 = await getOath2();
	ctx.redirect(oauth2.getAuthorizeUrl(params));
});

router.get('/gh/cb', async ctx => {
	const userToken = getUserToken(ctx);

	const oauth2 = await getOath2();

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
					'User-Agent': config.userAgent
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
					'User-Agent': config.userAgent
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

export default router;
