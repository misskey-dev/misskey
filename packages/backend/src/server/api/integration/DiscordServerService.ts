import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
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
import { FastifyReplyError } from '@/misc/fastify-reply-error.js';
import { bindThis } from '@/decorators.js';
import { SigninService } from '../SigninService.js';
import type { FastifyInstance, FastifyRequest, FastifyPluginOptions } from 'fastify';

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
		//this.create = this.create.bind(this);
	}

	@bindThis
	public create(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.get('/disconnect/discord', async (request, reply) => {
			if (!this.compareOrigin(request)) {
				throw new FastifyReplyError(400, 'invalid origin');
			}

			const userToken = this.getUserToken(request);
			if (!userToken) {
				throw new FastifyReplyError(400, 'signin required');
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

			// Publish i updated event
			this.globalEventService.publishMainStream(user.id, 'meUpdated', await this.userEntityService.pack(user, user, {
				detail: true,
				includeSecrets: true,
			}));

			return 'Discordの連携を解除しました :v:';
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

		fastify.get('/connect/discord', async (request, reply) => {
			if (!this.compareOrigin(request)) {
				throw new FastifyReplyError(400, 'invalid origin');
			}

			const userToken = this.getUserToken(request);
			if (!userToken) {
				throw new FastifyReplyError(400, 'signin required');
			}

			const params = {
				redirect_uri: `${this.config.url}/api/dc/cb`,
				scope: ['identify'],
				state: uuid(),
				response_type: 'code',
			};

			this.redisClient.set(userToken, JSON.stringify(params));

			const oauth2 = await getOAuth2();
			reply.redirect(oauth2!.getAuthorizeUrl(params));
		});

		fastify.get('/signin/discord', async (request, reply) => {
			const sessid = uuid();

			const params = {
				redirect_uri: `${this.config.url}/api/dc/cb`,
				scope: ['identify'],
				state: uuid(),
				response_type: 'code',
			};

			reply.setCookie('signin_with_discord_sid', sessid, {
				path: '/',
				secure: this.config.url.startsWith('https'),
				httpOnly: true,
			});

			this.redisClient.set(sessid, JSON.stringify(params));

			const oauth2 = await getOAuth2();
			reply.redirect(oauth2!.getAuthorizeUrl(params));
		});

		fastify.get('/dc/cb', async (request, reply) => {
			const userToken = this.getUserToken(request);

			const oauth2 = await getOAuth2();

			if (!userToken) {
				const sessid = request.cookies['signin_with_discord_sid'];

				if (!sessid) {
					throw new FastifyReplyError(400, 'invalid session');
				}

				const code = request.query.code;

				if (!code || typeof code !== 'string') {
					throw new FastifyReplyError(400, 'invalid session');
				}

				const { redirect_uri, state } = await new Promise<any>((res, rej) => {
					this.redisClient.get(sessid, async (_, state) => {
						if (state == null) throw new Error('empty state');
						res(JSON.parse(state));
					});
				});

				if (request.query.state !== state) {
					throw new FastifyReplyError(400, 'invalid session');
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
					throw new FastifyReplyError(400, 'invalid session');
				}

				const profile = await this.userProfilesRepository.createQueryBuilder()
					.where('"integrations"->\'discord\'->>\'id\' = :id', { id: id })
					.andWhere('"userHost" IS NULL')
					.getOne();

				if (profile == null) {
					throw new FastifyReplyError(404, `@${username}#${discriminator}と連携しているMisskeyアカウントはありませんでした...`);
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

				return this.signinService.signin(request, reply, await this.usersRepository.findOneBy({ id: profile.userId }) as ILocalUser, true);
			} else {
				const code = request.query.code;

				if (!code || typeof code !== 'string') {
					throw new FastifyReplyError(400, 'invalid session');
				}

				const { redirect_uri, state } = await new Promise<any>((res, rej) => {
					this.redisClient.get(userToken, async (_, state) => {
						if (state == null) throw new Error('empty state');
						res(JSON.parse(state));
					});
				});

				if (request.query.state !== state) {
					throw new FastifyReplyError(400, 'invalid session');
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
					throw new FastifyReplyError(400, 'invalid session');
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

				// Publish i updated event
				this.globalEventService.publishMainStream(user.id, 'meUpdated', await this.userEntityService.pack(user, user, {
					detail: true,
					includeSecrets: true,
				}));

				return `Discord: @${username}#${discriminator} を、Misskey: @${user.username} に接続しました！`;
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
