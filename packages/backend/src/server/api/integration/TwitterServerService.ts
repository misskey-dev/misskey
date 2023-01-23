import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuid } from 'uuid';
import { IsNull } from 'typeorm';
import * as autwh from 'autwh';
import type { Config } from '@/config.js';
import type { UserProfilesRepository, UsersRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import type { ILocalUser } from '@/models/entities/User.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { MetaService } from '@/core/MetaService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { FastifyReplyError } from '@/misc/fastify-reply-error.js';
import { bindThis } from '@/decorators.js';
import { SigninService } from '../SigninService.js';
import type { FastifyInstance, FastifyRequest, FastifyPluginOptions } from 'fastify';

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
		//this.create = this.create.bind(this);
	}

	@bindThis
	public create(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.get('/disconnect/twitter', async (request, reply) => {
			if (!this.compareOrigin(request)) {
				throw new FastifyReplyError(400, 'invalid origin');
			}

			const userToken = this.getUserToken(request);
			if (userToken == null) {
				throw new FastifyReplyError(400, 'signin required');
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

			// Publish i updated event
			this.globalEventService.publishMainStream(user.id, 'meUpdated', await this.userEntityService.pack(user, user, {
				detail: true,
				includeSecrets: true,
			}));

			return 'Twitterの連携を解除しました :v:';
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

		fastify.get('/connect/twitter', async (request, reply) => {
			if (!this.compareOrigin(request)) {
				throw new FastifyReplyError(400, 'invalid origin');
			}

			const userToken = this.getUserToken(request);
			if (userToken == null) {
				throw new FastifyReplyError(400, 'signin required');
			}

			const twAuth = await getTwAuth();
			const twCtx = await twAuth!.begin();
			this.redisClient.set(userToken, JSON.stringify(twCtx));
			reply.redirect(twCtx.url);
		});

		fastify.get('/signin/twitter', async (request, reply) => {
			const twAuth = await getTwAuth();
			const twCtx = await twAuth!.begin();

			const sessid = uuid();

			this.redisClient.set(sessid, JSON.stringify(twCtx));

			reply.setCookie('signin_with_twitter_sid', sessid, {
				path: '/',
				secure: this.config.url.startsWith('https'),
				httpOnly: true,
			});

			reply.redirect(twCtx.url);
		});

		fastify.get('/tw/cb', async (request, reply) => {
			const userToken = this.getUserToken(request);

			const twAuth = await getTwAuth();

			if (userToken == null) {
				const sessid = request.cookies['signin_with_twitter_sid'];

				if (sessid == null) {
					throw new FastifyReplyError(400, 'invalid session');
				}

				const get = new Promise<any>((res, rej) => {
					this.redisClient.get(sessid, async (_, twCtx) => {
						res(twCtx);
					});
				});

				const twCtx = await get;

				const verifier = request.query.oauth_verifier;
				if (!verifier || typeof verifier !== 'string') {
					throw new FastifyReplyError(400, 'invalid session');
				}

				const result = await twAuth!.done(JSON.parse(twCtx), verifier);

				const link = await this.userProfilesRepository.createQueryBuilder()
					.where('"integrations"->\'twitter\'->>\'userId\' = :id', { id: result.userId })
					.andWhere('"userHost" IS NULL')
					.getOne();

				if (link == null) {
					throw new FastifyReplyError(404, `@${result.screenName}と連携しているMisskeyアカウントはありませんでした...`);
				}

				return this.signinService.signin(request, reply, await this.usersRepository.findOneBy({ id: link.userId }) as ILocalUser, true);
			} else {
				const verifier = request.query.oauth_verifier;

				if (!verifier || typeof verifier !== 'string') {
					throw new FastifyReplyError(400, 'invalid session');
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

				// Publish i updated event
				this.globalEventService.publishMainStream(user.id, 'meUpdated', await this.userEntityService.pack(user, user, {
					detail: true,
					includeSecrets: true,
				}));

				return `Twitter: @${result.screenName} を、Misskey: @${user.username} に接続しました！`;
			}
		});

		done();
	}

	@bindThis
	private getUserToken(request: FastifyRequest): string | null {
		return ((request.headers['cookie'] ?? '').match(/igi=(\w+)/) ?? [null, null])[1];
	}
	
	@bindThis
	private compareOrigin(request: FastifyRequest): boolean {
		function normalizeUrl(url?: string): string {
			return url ? url.endsWith('/') ? url.substr(0, url.length - 1) : url : '';
		}
	
		const referer = request.headers['referer'];
	
		return (normalizeUrl(referer) === normalizeUrl(this.config.url));
	}
}
