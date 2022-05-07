import Koa from 'koa';
import Router from '@koa/router';
import { v4 as uuid } from 'uuid';
import autwh from 'autwh';
import { IsNull } from 'typeorm';
import { publishMainStream } from '@/services/stream.js';
import config from '@/config/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Users, UserProfiles } from '@/models/index.js';
import { ILocalUser } from '@/models/entities/user.js';
import signin from '../common/signin.js';
import { redisClient } from '../../../db/redis.js';

function getUserToken(ctx: Koa.BaseContext): string | null {
	return ((ctx.headers['cookie'] || '').match(/igi=(\w+)/) || [null, null])[1];
}

function compareOrigin(ctx: Koa.BaseContext): boolean {
	function normalizeUrl(url?: string): string {
		return url == null ? '' : url.endsWith('/') ? url.substr(0, url.length - 1) : url;
	}

	const referer = ctx.headers['referer'];

	return (normalizeUrl(referer) === normalizeUrl(config.url));
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

	const user = await Users.findOneByOrFail({
		host: IsNull(),
		token: userToken,
	});

	const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

	delete profile.integrations.twitter;

	await UserProfiles.update(user.id, {
		integrations: profile.integrations,
	});

	ctx.body = 'Twitterの連携を解除しました :v:';

	// Publish i updated event
	publishMainStream(user.id, 'meUpdated', await Users.pack(user, user, {
		detail: true,
		includeSecrets: true,
	}));
});

async function getTwAuth() {
	const meta = await fetchMeta(true);

	if (meta.enableTwitterIntegration && meta.twitterConsumerKey && meta.twitterConsumerSecret) {
		return autwh({
			consumerKey: meta.twitterConsumerKey,
			consumerSecret: meta.twitterConsumerSecret,
			callbackUrl: `${config.url}/api/tw/cb`,
		});
	} else {
		return null;
	}
}

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

	const twAuth = await getTwAuth();
	const twCtx = await twAuth!.begin();
	redisClient.set(userToken, JSON.stringify(twCtx));
	ctx.redirect(twCtx.url);
});

router.get('/signin/twitter', async ctx => {
	const twAuth = await getTwAuth();
	const twCtx = await twAuth!.begin();

	const sessid = uuid();

	redisClient.set(sessid, JSON.stringify(twCtx));

	ctx.cookies.set('signin_with_twitter_sid', sessid, {
		path: '/',
		secure: config.url.startsWith('https'),
		httpOnly: true,
	});

	ctx.redirect(twCtx.url);
});

router.get('/tw/cb', async ctx => {
	const userToken = getUserToken(ctx);

	const twAuth = await getTwAuth();

	if (userToken == null) {
		const sessid = ctx.cookies.get('signin_with_twitter_sid');

		if (sessid == null) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const get = new Promise<any>((res, rej) => {
			redisClient.get(sessid, async (_, twCtx) => {
				res(twCtx);
			});
		});

		const twCtx = await get;

		const verifier = ctx.query.oauth_verifier;
		if (!verifier || typeof verifier !== 'string') {
			ctx.throw(400, 'invalid session');
			return;
		}

		const result = await twAuth!.done(JSON.parse(twCtx), verifier);

		const link = await UserProfiles.createQueryBuilder()
			.where('"integrations"->\'twitter\'->>\'userId\' = :id', { id: result.userId })
			.andWhere('"userHost" IS NULL')
			.getOne();

		if (link == null) {
			ctx.throw(404, `@${result.screenName}と連携しているMisskeyアカウントはありませんでした...`);
			return;
		}

		signin(ctx, await Users.findOneBy({ id: link.userId }) as ILocalUser, true);
	} else {
		const verifier = ctx.query.oauth_verifier;

		if (!verifier || typeof verifier !== 'string') {
			ctx.throw(400, 'invalid session');
			return;
		}

		const get = new Promise<any>((res, rej) => {
			redisClient.get(userToken, async (_, twCtx) => {
				res(twCtx);
			});
		});

		const twCtx = await get;

		const result = await twAuth!.done(JSON.parse(twCtx), verifier);

		const user = await Users.findOneByOrFail({
			host: IsNull(),
			token: userToken,
		});

		const profile = await UserProfiles.findOneByOrFail({ userId: user.id });

		await UserProfiles.update(user.id, {
			integrations: {
				...profile.integrations,
				twitter: {
					accessToken: result.accessToken,
					accessTokenSecret: result.accessTokenSecret,
					userId: result.userId,
					screenName: result.screenName,
				},
			},
		});

		ctx.body = `Twitter: @${result.screenName} を、Misskey: @${user.username} に接続しました！`;

		// Publish i updated event
		publishMainStream(user.id, 'meUpdated', await Users.pack(user, user, {
			detail: true,
			includeSecrets: true,
		}));
	}
});

export default router;
