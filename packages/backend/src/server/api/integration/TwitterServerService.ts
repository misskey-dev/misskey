import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import Router from '@koa/router';
import { v4 as uuid } from 'uuid';
import { IsNull } from 'typeorm';
import autwh from 'autwh';
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
export class TwitterServerService {
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

		router.get('/disconnect/twitter', async ctx => {
			if (!this.compareOrigin(ctx)) {
				ctx.throw(400, 'invalid origin');
				return;
			}

			const userToken = this.getUserToken(ctx);
			if (userToken == null) {
				ctx.throw(400, 'signin required');
				return;
			}

			const user = await this.usersRepository.findOneByOrFail({
				host: IsNull(),
				token: userToken,
			});

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

			delete profile.integrations.twitter;

			await this.userProfilesRepository.update(user.id, {
				integrations: profile.integrations,
			});

			ctx.body = 'Twitterの連携を解除しました :v:';

			// Publish i updated event
			this.globalEventService.publishMainStream(user.id, 'meUpdated', await this.userEntityService.pack(user, user, {
				detail: true,
				includeSecrets: true,
			}));
		});

		const getTwAuth = async () => {
			const meta = await this.metaService.fetch(true);

			if (meta.enableTwitterIntegration && meta.twitterConsumerKey && meta.twitterConsumerSecret) {
				return autwh({
					consumerKey: meta.twitterConsumerKey,
					consumerSecret: meta.twitterConsumerSecret,
					callbackUrl: `${this.config.url}/api/tw/cb`,
				});
			} else {
				return null;
			}
		};

		router.get('/connect/twitter', async ctx => {
			if (!this.compareOrigin(ctx)) {
				ctx.throw(400, 'invalid origin');
				return;
			}

			const userToken = this.getUserToken(ctx);
			if (userToken == null) {
				ctx.throw(400, 'signin required');
				return;
			}

			const twAuth = await getTwAuth();
			const twCtx = await twAuth!.begin();
			this.redisClient.set(userToken, JSON.stringify(twCtx));
			ctx.redirect(twCtx.url);
		});

		router.get('/signin/twitter', async ctx => {
			const twAuth = await getTwAuth();
			const twCtx = await twAuth!.begin();

			const sessid = uuid();

			this.redisClient.set(sessid, JSON.stringify(twCtx));

			ctx.cookies.set('signin_with_twitter_sid', sessid, {
				path: '/',
				secure: this.config.url.startsWith('https'),
				httpOnly: true,
			});

			ctx.redirect(twCtx.url);
		});

		router.get('/tw/cb', async ctx => {
			const userToken = this.getUserToken(ctx);

			const twAuth = await getTwAuth();

			if (userToken == null) {
				const sessid = ctx.cookies.get('signin_with_twitter_sid');

				if (sessid == null) {
					ctx.throw(400, 'invalid session');
					return;
				}

				const get = new Promise<any>((res, rej) => {
					this.redisClient.get(sessid, async (_, twCtx) => {
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

				const link = await this.userProfilesRepository.createQueryBuilder()
					.where('"integrations"->\'twitter\'->>\'userId\' = :id', { id: result.userId })
					.andWhere('"userHost" IS NULL')
					.getOne();

				if (link == null) {
					ctx.throw(404, `@${result.screenName}と連携しているMisskeyアカウントはありませんでした...`);
					return;
				}

				this.signinService.signin(ctx, await this.usersRepository.findOneBy({ id: link.userId }) as ILocalUser, true);
			} else {
				const verifier = ctx.query.oauth_verifier;

				if (!verifier || typeof verifier !== 'string') {
					ctx.throw(400, 'invalid session');
					return;
				}

				const get = new Promise<any>((res, rej) => {
					this.redisClient.get(userToken, async (_, twCtx) => {
						res(twCtx);
					});
				});

				const twCtx = await get;

				const result = await twAuth!.done(JSON.parse(twCtx), verifier);

				const user = await this.usersRepository.findOneByOrFail({
					host: IsNull(),
					token: userToken,
				});

				const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

				await this.userProfilesRepository.update(user.id, {
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
