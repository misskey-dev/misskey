import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as uuid from 'uuid';
import autwh from 'autwh';
import redis from '../../../db/redis';
import User, { pack, ILocalUser } from '../../../models/user';
import event from '../../../publishers/stream';
import config from '../../../config';
import signin from '../common/signin';

function getUserToken(ctx: Koa.Context) {
	return ((ctx.headers['cookie'] || '').match(/i=(!\w+)/) || [null, null])[1];
}

function compareOrigin(ctx: Koa.Context) {
	function normalizeUrl(url: string) {
		return url[url.length - 1] === '/' ? url.substr(0, url.length - 1) : url;
	}

	const referer = ctx.headers['referer'];

	return (normalizeUrl(referer) == normalizeUrl(config.url));
}

// Init router
const router = new Router();

router.get('/disconnect/twitter', async ctx => {
	if (!compareOrigin(ctx)) {
		ctx.throw(400, 'invalid origin');
		return;
	}

	const userToken = getUserToken(ctx);
	if (userToken == null) {
		ctx.throw(400, 'signin required');
		return;
	}

	const user = await User.findOneAndUpdate({
		host: null,
		'token': userToken
	}, {
		$set: {
			'twitter': null
		}
	});

	ctx.body = `Twitterの連携を解除しました :v:`;

	// Publish i updated event
	event(user._id, 'meUpdated', await pack(user, user, {
		detail: true,
		includeSecrets: true
	}));
});

if (config.twitter == null) {
	router.get('/connect/twitter', ctx => {
		ctx.body = '現在Twitterへ接続できません (このインスタンスではTwitterはサポートされていません)';
	});

	router.get('/signin/twitter', ctx => {
		ctx.body = '現在Twitterへ接続できません (このインスタンスではTwitterはサポートされていません)';
	});
} else {
	const twAuth = autwh({
		consumerKey: config.twitter.consumer_key,
		consumerSecret: config.twitter.consumer_secret,
		callbackUrl: `${config.url}/api/tw/cb`
	});

	router.get('/connect/twitter', async ctx => {
		if (!compareOrigin(ctx)) {
			ctx.throw(400, 'invalid origin');
			return;
		}

		const userToken = getUserToken(ctx);
		if (userToken == null) {
			ctx.throw(400, 'signin required');
			return;
		}

		const twCtx = await twAuth.begin();
		redis.set(userToken, JSON.stringify(twCtx));
		ctx.redirect(twCtx.url);
	});

	router.get('/signin/twitter', async ctx => {
		const twCtx = await twAuth.begin();

		const sessid = uuid();

		redis.set(sessid, JSON.stringify(twCtx));

		const expires = 1000 * 60 * 60; // 1h
		ctx.cookies.set('signin_with_twitter_session_id', sessid, {
			path: '/',
			domain: config.host,
			secure: config.url.startsWith('https'),
			httpOnly: true,
			expires: new Date(Date.now() + expires),
			maxAge: expires
		});

		ctx.redirect(twCtx.url);
	});

	router.get('/tw/cb', async ctx => {
		const userToken = getUserToken(ctx);

		if (userToken == null) {
			const sessid = ctx.cookies.get('signin_with_twitter_session_id');

			if (sessid == null) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const get = new Promise<any>((res, rej) => {
				redis.get(sessid, async (_, twCtx) => {
					res(twCtx);
				});
			});

			const twCtx = await get;

			const result = await twAuth.done(JSON.parse(twCtx), ctx.query.oauth_verifier);

			const user = await User.findOne({
				host: null,
				'twitter.userId': result.userId
			}) as ILocalUser;

			if (user == null) {
				ctx.throw(404, `@${result.screenName}と連携しているMisskeyアカウントはありませんでした...`);
				return;
			}

			signin(ctx, user, true);
		} else {
			const verifier = ctx.query.oauth_verifier;

			if (verifier == null) {
				ctx.throw(400, 'invalid session');
				return;
			}

			const get = new Promise<any>((res, rej) => {
				redis.get(userToken, async (_, twCtx) => {
					res(twCtx);
				});
			});

			const twCtx = await get;

			const result = await twAuth.done(JSON.parse(twCtx), verifier);

			const user = await User.findOneAndUpdate({
				host: null,
				token: userToken
			}, {
				$set: {
					twitter: {
						accessToken: result.accessToken,
						accessTokenSecret: result.accessTokenSecret,
						userId: result.userId,
						screenName: result.screenName
					}
				}
			});

			ctx.body = `Twitter: @${result.screenName} を、Misskey: @${user.username} に接続しました！`;

			// Publish i updated event
			event(user._id, 'meUpdated', await pack(user, user, {
				detail: true,
				includeSecrets: true
			}));
		}
	});
}

module.exports = router;
