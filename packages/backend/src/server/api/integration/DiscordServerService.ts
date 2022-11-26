import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import Router from '@koa/router';
import { OAuth2 } from 'oauth';
import { v4 as uuid } from 'uuid';
import { IsNull } from 'typeorm';
import type { Config } from '@/config.js';
import type { UserProfilesRepository, UsersRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import type { ILocalUser } from '@/models/entities/User.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { MetaService } from '@/core/MetaService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { SigninService } from '../SigninService.js';
import type Koa from 'koa';

@Injectable()
export class DiscordServerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private httpRequestService: HttpRequestService,
		private globalEventService: GlobalEventService,
		private metaService: MetaService,
		private signinService: SigninService,
	) {
	}

	public create() {
		const router = new Router();

		router.get('/disconnect/discord', async ctx => {
			if (!this.compareOrigin(ctx)) {
				ctx.throw(400, 'invalid origin');
				return;
			}

			const userToken = this.getUserToken(ctx);
			if (!userToken) {
				ctx.throw(400, 'signin required');
				return;
			}

			const user = await this.usersRepository.findOneByOrFail({
				host: IsNull(),
				token: userToken,
			});

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

			delete profile.integrations.discord;

			await this.userProfilesRepository.update(user.id, {
				integrations: profile.integrations,
			});

			ctx.body = 'Discordの連携を解除しました :v:';

			// Publish i updated event
			this.globalEventService.publishMainStream(user.id, 'meUpdated', await this.userEntityService.pack(user, user, {
				detail: true,
				includeSecrets: true,
			}));
		});

		const getOAuth2 = async () => {
			const meta = await this.metaService.fetch(true);

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
		};

		router.get('/connect/discord', async ctx => {
			if (!this.compareOrigin(ctx)) {
				ctx.throw(400, 'invalid origin');
				return;
			}

			const userToken = this.getUserToken(ctx);
			if (!userToken) {
				ctx.throw(400, 'signin required');
				return;
			}

			const params = {
				redirect_uri: `${this.config.url}/api/dc/cb`,
				scope: ['identify'],
				state: uuid(),
				response_type: 'code',
			};

			this.redisClient.set(userToken, JSON.stringify(params));

			const oauth2 = await getOAuth2();
			ctx.redirect(oauth2!.getAuthorizeUrl(params));
		});

		router.get('/signin/discord', async ctx => {
			const sessid = uuid();

			const params = {
				redirect_uri: `${this.config.url}/api/dc/cb`,
				scope: ['identify'],
				state: uuid(),
				response_type: 'code',
			};

			ctx.cookies.set('signin_with_discord_sid', sessid, {
				path: '/',
				secure: this.config.url.startsWith('https'),
				httpOnly: true,
			});

			this.redisClient.set(sessid, JSON.stringify(params));

			const oauth2 = await getOAuth2();
			ctx.redirect(oauth2!.getAuthorizeUrl(params));
		});

		router.get('/dc/cb', async ctx => {
			const userToken = this.getUserToken(ctx);

			const oauth2 = await getOAuth2();

			if (!userToken) {
				const sessid = ctx.cookies.get('signin_with_discord_sid');

				if (!sessid) {
					ctx.throw(400, 'invalid session');
					return;
				}

				const code = ctx.query.code;

				if (!code || typeof code !== 'string') {
					ctx.throw(400, 'invalid session');
					return;
				}

				const { redirect_uri, state } = await new Promise<any>((res, rej) => {
					this.redisClient.get(sessid, async (_, state) => {
						if (state == null) throw new Error('empty state');
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
						redirect_uri,
					}, (err, accessToken, refreshToken, result) => {
						if (err) {
							rej(err);
						} else if (result.error) {
							rej(result.error);
						} else {
							res({
								accessToken,
								refreshToken,
								expiresDate: Date.now() + Number(result.expires_in) * 1000,
							});
						}
					}));

				const { id, username, discriminator } = (await this.httpRequestService.getJson('https://discord.com/api/users/@me', '*/*', 10 * 1000, {
					'Authorization': `Bearer ${accessToken}`,
				})) as Record<string, unknown>;

				if (typeof id !== 'string' || typeof username !== 'string' || typeof discriminator !== 'string') {
					ctx.throw(400, 'invalid session');
					return;
				}

				const profile = await this.userProfilesRepository.createQueryBuilder()
					.where('"integrations"->\'discord\'->>\'id\' = :id', { id: id })
					.andWhere('"userHost" IS NULL')
					.getOne();

				if (profile == null) {
					ctx.throw(404, `@${username}#${discriminator}と連携しているMisskeyアカウントはありませんでした...`);
					return;
				}

				await this.userProfilesRepository.update(profile.userId, {
					integrations: {
						...profile.integrations,
						discord: {
							id: id,
							accessToken: accessToken,
							refreshToken: refreshToken,
							expiresDate: expiresDate,
							username: username,
							discriminator: discriminator,
						},
					},
				});

				this.signinService.signin(ctx, await this.usersRepository.findOneBy({ id: profile.userId }) as ILocalUser, true);
			} else {
				const code = ctx.query.code;

				if (!code || typeof code !== 'string') {
					ctx.throw(400, 'invalid session');
					return;
				}

				const { redirect_uri, state } = await new Promise<any>((res, rej) => {
					this.redisClient.get(userToken, async (_, state) => {
						if (state == null) throw new Error('empty state');
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
						redirect_uri,
					}, (err, accessToken, refreshToken, result) => {
						if (err) {
							rej(err);
						} else if (result.error) {
							rej(result.error);
						} else {
							res({
								accessToken,
								refreshToken,
								expiresDate: Date.now() + Number(result.expires_in) * 1000,
							});
						}
					}));

				const { id, username, discriminator } = (await this.httpRequestService.getJson('https://discord.com/api/users/@me', '*/*', 10 * 1000, {
					'Authorization': `Bearer ${accessToken}`,
				})) as Record<string, unknown>;
				if (typeof id !== 'string' || typeof username !== 'string' || typeof discriminator !== 'string') {
					ctx.throw(400, 'invalid session');
					return;
				}

				const user = await this.usersRepository.findOneByOrFail({
					host: IsNull(),
					token: userToken,
				});

				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

				await this.userProfilesRepository.update(user.id, {
					integrations: {
						...profile.integrations,
						discord: {
							accessToken: accessToken,
							refreshToken: refreshToken,
							expiresDate: expiresDate,
							id: id,
							username: username,
							discriminator: discriminator,
						},
					},
				});

				ctx.body = `Discord: @${username}#${discriminator} を、Misskey: @${user.username} に接続しました！`;

				// Publish i updated event
				this.globalEventService.publishMainStream(user.id, 'meUpdated', await this.userEntityService.pack(user, user, {
					detail: true,
					includeSecrets: true,
				}));
			}
		});

		return router;
	}

	private getUserToken(ctx: Koa.BaseContext): string | null {
		return ((ctx.headers['cookie'] ?? '').match(/igi=(\w+)/) ?? [null, null])[1];
	}
	
	private compareOrigin(ctx: Koa.BaseContext): boolean {
		function normalizeUrl(url?: string): string {
			return url ? url.endsWith('/') ? url.substr(0, url.length - 1) : url : '';
		}
	
		const referer = ctx.headers['referer'];
	
		return (normalizeUrl(referer) === normalizeUrl(this.config.url));
	}
}
