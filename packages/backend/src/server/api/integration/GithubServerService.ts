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
export class GithubServerService {
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

		router.get('/disconnect/github', async ctx => {
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

			delete profile.integrations.github;

			await this.userProfilesRepository.update(user.id, {
				integrations: profile.integrations,
			});

			ctx.body = 'GitHubの連携を解除しました :v:';

			// Publish i updated event
			this.globalEventService.publishMainStream(user.id, 'meUpdated', await this.userEntityService.pack(user, user, {
				detail: true,
				includeSecrets: true,
			}));
		});

		const getOath2 = async () => {
			const meta = await this.metaService.fetch(true);

			if (meta.enableGithubIntegration && meta.githubClientId && meta.githubClientSecret) {
				return new OAuth2(
					meta.githubClientId,
					meta.githubClientSecret,
					'https://github.com/',
					'login/oauth/authorize',
					'login/oauth/access_token');
			} else {
				return null;
			}
		};

		router.get('/connect/github', async ctx => {
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
				redirect_uri: `${this.config.url}/api/gh/cb`,
				scope: ['read:user'],
				state: uuid(),
			};

			this.redisClient.set(userToken, JSON.stringify(params));

			const oauth2 = await getOath2();
			ctx.redirect(oauth2!.getAuthorizeUrl(params));
		});

		router.get('/signin/github', async ctx => {
			const sessid = uuid();

			const params = {
				redirect_uri: `${this.config.url}/api/gh/cb`,
				scope: ['read:user'],
				state: uuid(),
			};

			ctx.cookies.set('signin_with_github_sid', sessid, {
				path: '/',
				secure: this.config.url.startsWith('https'),
				httpOnly: true,
			});

			this.redisClient.set(sessid, JSON.stringify(params));

			const oauth2 = await getOath2();
			ctx.redirect(oauth2!.getAuthorizeUrl(params));
		});

		router.get('/gh/cb', async ctx => {
			const userToken = this.getUserToken(ctx);

			const oauth2 = await getOath2();

			if (!userToken) {
				const sessid = ctx.cookies.get('signin_with_github_sid');

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

				const { accessToken } = await new Promise<{ accessToken: string }>((res, rej) =>
					oauth2!.getOAuthAccessToken(code, {
						redirect_uri,
					}, (err, accessToken, refresh, result) => {
						if (err) {
							rej(err);
						} else if (result.error) {
							rej(result.error);
						} else {
							res({ accessToken });
						}
					}));

				const { login, id } = (await this.httpRequestService.getJson('https://api.github.com/user', 'application/vnd.github.v3+json', 10 * 1000, {
					'Authorization': `bearer ${accessToken}`,
				})) as Record<string, unknown>;
				if (typeof login !== 'string' || typeof id !== 'string') {
					ctx.throw(400, 'invalid session');
					return;
				}

				const link = await this.userProfilesRepository.createQueryBuilder()
					.where('"integrations"->\'github\'->>\'id\' = :id', { id: id })
					.andWhere('"userHost" IS NULL')
					.getOne();

				if (link == null) {
					ctx.throw(404, `@${login}と連携しているMisskeyアカウントはありませんでした...`);
					return;
				}

				this.signinService.signin(ctx, await this.usersRepository.findOneBy({ id: link.userId }) as ILocalUser, true);
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

				const { accessToken } = await new Promise<{ accessToken: string }>((res, rej) =>
					oauth2!.getOAuthAccessToken(
						code,
						{ redirect_uri },
						(err, accessToken, refresh, result) => {
							if (err) {
								rej(err);
							} else if (result.error) {
								rej(result.error);
							} else {
								res({ accessToken });
							}
						}));

				const { login, id } = (await this.httpRequestService.getJson('https://api.github.com/user', 'application/vnd.github.v3+json', 10 * 1000, {
					'Authorization': `bearer ${accessToken}`,
				})) as Record<string, unknown>;

				if (typeof login !== 'string' || typeof id !== 'string') {
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
						github: {
							accessToken: accessToken,
							id: id,
							login: login,
						},
					},
				});

				ctx.body = `GitHub: @${login} を、Misskey: @${user.username} に接続しました！`;

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
