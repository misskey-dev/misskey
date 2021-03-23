import * as Koa from 'koa';
import * as Router from '@koa/router';
import { getJson } from '../../../misc/fetch';
import { OAuth2 } from 'oauth';
import config from '../../../config';
import { publishMainStream } from '../../../services/stream';
import { redisClient } from '../../../db/redis';
import { v4 as uuid } from 'uuid';
import signin from '../common/signin';
import { fetchMeta } from '../../../misc/fetch-meta';
import { Users, UserProfiles } from '../../../models';
import { ILocalUser } from '../../../models/entities/user';

function getUserToken(ctx: Koa.Context) {
	return ((ctx.headers['cookie'] || '').match(/igi=(\w+)/) || [null, null])[1];
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

router.get('/disconnect/discord', async ctx => {
	if (!compareOrigin(ctx)) {
		ctx.throw(400, 'invalid origin');
		return;
	}

	const userToken = getUserToken(ctx);
	if (!userToken) {
		ctx.throw(400, 'signin required');
		return;
	}

	const user = await Users.findOneOrFail({
		host: null,
		token: userToken
	});

	const profile = await UserProfiles.findOneOrFail(user.id);

	delete profile.integrations.discord;

	await UserProfiles.update(user.id, {
		integrations: profile.integrations,
	});

	ctx.body = `Discordの連携を解除しました :v:`;

	// Publish i updated event
	publishMainStream(user.id, 'meUpdated', await Users.pack(user, user, {
		detail: true,
		includeSecrets: true
	}));
});

async function getOAuth2() {
	const meta = await fetchMeta(true);

	if (meta.enableDiscordIntegration) {
		return new OAuth2(
			meta.discordClientId!,
			meta.discordClientSecret!,
			'https://discord.com/',
			'api/oauth2/authorize',
			'api/oauth2/token');
	} else {
		return null;
	}
}

router.get('/connect/discord', async ctx => {
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
		redirect_uri: `${config.url}/api/dc/cb`,
		scope: ['identify'],
		state: uuid(),
		response_type: 'code'
	};

	redisClient.set(userToken, JSON.stringify(params));

	const oauth2 = await getOAuth2();
	ctx.redirect(oauth2!.getAuthorizeUrl(params));
});

router.get('/signin/discord', async ctx => {
	const sessid = uuid();

	const params = {
		redirect_uri: `${config.url}/api/dc/cb`,
		scope: ['identify'],
		state: uuid(),
		response_type: 'code'
	};

	ctx.cookies.set('signin_with_discord_sid', sessid, {
		path: '/',
		secure: config.url.startsWith('https'),
		httpOnly: true
	});

	redisClient.set(sessid, JSON.stringify(params));

	const oauth2 = await getOAuth2();
	ctx.redirect(oauth2!.getAuthorizeUrl(params));
});

router.get('/dc/cb', async ctx => {
	const userToken = getUserToken(ctx);

	const oauth2 = await getOAuth2();

	if (!userToken) {
		const sessid = ctx.cookies.get('signin_with_discord_sid');

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
			redisClient.get(sessid, async (_, state) => {
				res(JSON.parse(state));
			});
		});

		if (ctx.query.state !== state) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const { accessToken, refreshToken, expiresDate } = await new Promise<any>((res, rej) =>
			oauth2!.getOAuthAccessToken(code, {
				grant_type: 'authorization_code',
				redirect_uri
			}, (err, accessToken, refreshToken, result) => {
				if (err) {
					rej(err);
				} else if (result.error) {
					rej(result.error);
				} else {
					res({
						accessToken,
						refreshToken,
						expiresDate: Date.now() + Number(result.expires_in) * 1000
					});
				}
			}));

		const { id, username, discriminator } = await getJson('https://discord.com/api/users/@me', '*/*', 10 * 1000, {
			'Authorization': `Bearer ${accessToken}`,
		});

		if (!id || !username || !discriminator) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const profile = await UserProfiles.createQueryBuilder()
			.where(`"integrations"->'discord'->>'id' = :id`, { id: id })
			.andWhere('"userHost" IS NULL')
			.getOne();

		if (profile == null) {
			ctx.throw(404, `@${username}#${discriminator}と連携しているMisskeyアカウントはありませんでした...`);
			return;
		}

		await UserProfiles.update(profile.userId, {
			integrations: {
				...profile.integrations,
				discord: {
					id: id,
					accessToken: accessToken,
					refreshToken: refreshToken,
					expiresDate: expiresDate,
					username: username,
					discriminator: discriminator
				}
			},
		});

		signin(ctx, await Users.findOne(profile.userId) as ILocalUser, true);
	} else {
		const code = ctx.query.code;

		if (!code) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const { redirect_uri, state } = await new Promise<any>((res, rej) => {
			redisClient.get(userToken, async (_, state) => {
				res(JSON.parse(state));
			});
		});

		if (ctx.query.state !== state) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const { accessToken, refreshToken, expiresDate } = await new Promise<any>((res, rej) =>
			oauth2!.getOAuthAccessToken(code, {
				grant_type: 'authorization_code',
				redirect_uri
			}, (err, accessToken, refreshToken, result) => {
				if (err) {
					rej(err);
				} else if (result.error) {
					rej(result.error);
				} else {
					res({
						accessToken,
						refreshToken,
						expiresDate: Date.now() + Number(result.expires_in) * 1000
					});
				}
			}));

		const { id, username, discriminator } = await getJson('https://discord.com/api/users/@me', '*/*', 10 * 1000, {
			'Authorization': `Bearer ${accessToken}`,
		});
		if (!id || !username || !discriminator) {
			ctx.throw(400, 'invalid session');
			return;
		}

		const user = await Users.findOneOrFail({
			host: null,
			token: userToken
		});

		const profile = await UserProfiles.findOneOrFail(user.id);

		await UserProfiles.update(user.id, {
			integrations: {
				...profile.integrations,
				discord: {
					accessToken: accessToken,
					refreshToken: refreshToken,
					expiresDate: expiresDate,
					id: id,
					username: username,
					discriminator: discriminator
				}
			}
		});

		ctx.body = `Discord: @${username}#${discriminator} を、Misskey: @${user.username} に接続しました！`;

		// Publish i updated event
		publishMainStream(user.id, 'meUpdated', await Users.pack(user, user, {
			detail: true,
			includeSecrets: true
		}));
	}
});

export default router;
