import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import pug from 'pug';
import fastifyView from '@fastify/view';
import fastifyCors from '@fastify/cors';
import fastifyFormbody from '@fastify/formbody';
import fastifyHttpErrorsEnhanced from 'fastify-http-errors-enhanced';
import * as jose from 'jose';
import { JWTPayload } from 'jose';
import Logger from '@/logger.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import type { Config } from '@/config.js';
import type {
	SingleSignOnServiceProviderRepository,
	UserProfilesRepository,
	UsersRepository,
} from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import { CacheService } from '@/core/CacheService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { RoleService } from '@/core/RoleService.js';
import { normalizeEmailAddress } from '@/misc/normalize-email-address.js';
import type { FastifyInstance } from 'fastify';

@Injectable()
export class JWTIdentifyProviderService {
	#logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
		@Inject(DI.singleSignOnServiceProviderRepository)
		private singleSignOnServiceProviderRepository: SingleSignOnServiceProviderRepository,
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private roleService: RoleService,
		private cacheService: CacheService,
		private loggerService: LoggerService,
	) {
		this.#logger = this.loggerService.getLogger('sso:jwt');
	}

	@bindThis
	public async createServer(fastify: FastifyInstance): Promise<void> {
		fastify.register(fastifyHttpErrorsEnhanced, { preHandler: (error: Error): Error => { this.#logger.error(error); return error; } });
		fastify.register(fastifyFormbody);
		fastify.register(fastifyCors);
		fastify.register(fastifyView, {
			root: fileURLToPath(new URL('../web/views', import.meta.url)),
			engine: { pug },
			defaultContext: {
				version: this.config.version,
				config: this.config,
			},
		});

		fastify.all<{
			Params: { serviceId: string };
			Querystring?: { serviceurl?: string, return_to?: string };
			Body?: { serviceurl?: string, return_to?: string };
		}>('/:serviceId', async (request, reply) => {
			const serviceId = request.params.serviceId;
			const returnTo = request.query?.return_to ?? request.query?.serviceurl ?? request.body?.return_to ?? request.body?.serviceurl;

			const ssoServiceProvider = await this.singleSignOnServiceProviderRepository.findOneBy({ id: serviceId, type: 'jwt' });
			if (!ssoServiceProvider) {
				reply.status(403).send({
					error: {
						message: 'Invalid SSO Service Provider id',
						code: 'INVALID_SSO_SP_ID',
						id: 'c6aafae6-e8b9-420c-a87a-6ac08402165b',
						kind: 'client',
					},
				});
				return;
			}

			const transactionId = randomUUID();
			await this.redisClient.set(
				`sso:jwt:transaction:${transactionId}`,
				JSON.stringify({
					serviceId: serviceId,
					returnTo: returnTo,
				}),
				'EX',
				60 * 5,
			);

			this.#logger.info(`Rendering authorization page for "${ssoServiceProvider.name ?? ssoServiceProvider.issuer}"`);

			reply.header('Cache-Control', 'no-store');
			return await reply.view('sso', {
				transactionId: transactionId,
				serviceName: ssoServiceProvider.name ?? ssoServiceProvider.issuer,
				kind: 'jwt',
			});
		});

		fastify.post<{
			Body: { transaction_id: string; login_token: string; };
		}>('/authorize', async (request, reply) => {
			const transactionId = request.body.transaction_id;
			const token = request.body.login_token;

			const transaction = await this.redisClient.get(`sso:jwt:transaction:${transactionId}`);
			if (!transaction) {
				reply.status(403).send({
					error: {
						message: 'Invalid transaction id',
						code: 'INVALID_TRANSACTION_ID',
						id: '91fa6511-0b33-47d6-bd01-b420d80fcd6a',
						kind: 'client',
					},
				});
				return;
			}

			const { serviceId, returnTo } = JSON.parse(transaction);

			const ssoServiceProvider = await this.singleSignOnServiceProviderRepository.findOneBy({ id: serviceId, type: 'jwt' });
			if (!ssoServiceProvider) {
				reply.status(403).send({
					error: {
						message: 'Invalid SSO Service Provider id',
						code: 'INVALID_SSO_SP_ID',
						id: 'c038610c-4c11-40ce-9371-131d5720f511',
						kind: 'client',
					},
				});
				return;
			}

			if (!token) {
				reply.status(401).send({
					error: {
						message: 'No login token',
						code: 'NO_LOGIN_TOKEN',
						id: '399e756c-35cd-459c-a7ba-8cc12eb39eef',
						kind: 'client',
					},
				});
				return;
			}

			const user = await this.cacheService.localUserByNativeTokenCache.fetch(
				token,
				() => this.usersRepository.findOneBy({ token }) as Promise<MiLocalUser | null>,
			);
			if (!user) {
				reply.status(403).send({
					error: {
						message: 'Invalid login token',
						code: 'INVALID_LOGIN_TOKEN',
						id: '3b92ee31-9215-447a-805f-df8f15ffb8b2',
						kind: 'client',
					},
				});
				return;
			}

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });
			const isAdministrator = await this.roleService.isAdministrator(user);
			const isModerator = await this.roleService.isModerator(user);
			const roles = await this.roleService.getUserRoles(user.id);

			const payload: JWTPayload = {
				name: user.name ? `${user.name} (@${user.username})` : `@${user.username}`,
				given_name: user.name ?? undefined,
				family_name: `@${user.username}`,
				preferred_username: user.username,
				profile: `${this.config.url}/@${user.username}`,
				picture: user.avatarUrl ?? undefined,
				email: profile.emailVerified ? normalizeEmailAddress(profile.email) : `${user.username}@${this.config.hostname}`,
				email_verified: profile.emailVerified,
				mfa_enabled: profile.twoFactorEnabled,
				updated_at: Math.floor((user.updatedAt?.getTime() ?? user.createdAt.getTime()) / 1000),
				admin: isAdministrator,
				moderator: isModerator,
				roles: roles.filter(r => r.isPublic).map(r => r.id),
			};

			let jwt: string;
			try {
				if (ssoServiceProvider.cipherAlgorithm) {
					const key = ssoServiceProvider.publicKey.startsWith('{')
						? await jose.importJWK(JSON.parse(ssoServiceProvider.publicKey))
						: jose.base64url.decode(ssoServiceProvider.publicKey);

					jwt = await new jose.EncryptJWT(payload)
						.setProtectedHeader({
							typ: 'JWT',
							alg: ssoServiceProvider.signatureAlgorithm,
							enc: ssoServiceProvider.cipherAlgorithm,
						})
						.setIssuer(ssoServiceProvider.issuer)
						.setAudience(ssoServiceProvider.audience)
						.setIssuedAt()
						.setExpirationTime('2w')
						.setJti(randomUUID())
						.setSubject(user.id)
						.encrypt(key);
				} else {
					const key = ssoServiceProvider.privateKey
						? await jose.importJWK(JSON.parse(ssoServiceProvider.privateKey))
						: jose.base64url.decode(ssoServiceProvider.publicKey);

					jwt = await new jose.SignJWT(payload)
						.setProtectedHeader({
							typ: 'JWT',
							alg: ssoServiceProvider.signatureAlgorithm,
						})
						.setIssuer(ssoServiceProvider.issuer)
						.setAudience(ssoServiceProvider.audience)
						.setIssuedAt()
						.setExpirationTime('2w')
						.setJti(randomUUID())
						.setSubject(user.id)
						.sign(key);
				}
			} catch (err) {
				this.#logger.error('Failed to create JWT', { error: err });
				const traceableError = err as Error & { code?: string };

				if (traceableError.code) {
					reply.status(500).send({
						error: {
							message: traceableError.message,
							code: traceableError.code,
							id: 'a436fa15-20ca-4269-ac4d-ee162fe1f3b0',
							kind: 'server',
						},
					});
					return;
				}

				reply.status(500).send({
					error: {
						message: 'Internal server error',
						code: 'INTERNAL_SERVER_ERROR',
						id: 'fe1c597c-a515-46a1-860b-bd316b11aff9',
						kind: 'server',
					},
				});
				return;
			} finally {
				await this.redisClient.del(`sso:jwt:transaction:${transactionId}`);
			}

			this.#logger.info(`User "${user.username}" authorized for "${ssoServiceProvider.name ?? ssoServiceProvider.issuer}"`);
			reply.header('Cache-Control', 'no-store');
			switch (ssoServiceProvider.binding) {
				case 'post': return reply
					.status(200)
					.send({
						binding: 'post',
						action: ssoServiceProvider.acsUrl,
						context: {
							jwt,
							return_to: returnTo ?? undefined,
						},
					});

				case 'redirect': return reply
					.status(200)
					.send({
						binding: 'redirect',
						action: !returnTo
							? `${ssoServiceProvider.acsUrl}?jwt=${jwt}`
							: `${ssoServiceProvider.acsUrl}?jwt=${jwt}&return_to=${returnTo}`,
					});
			}
		});
	}

	@bindThis
	public async createApiServer(fastify: FastifyInstance): Promise<void> {
		fastify.register(fastifyHttpErrorsEnhanced, { preHandler: (error: Error): Error => { this.#logger.error(error); return error; } });
		fastify.register(fastifyFormbody);
		fastify.register(fastifyCors);

		fastify.post<{
			Params: { serviceId: string };
			Body: { jwt: string };
		}>('/verify/:serviceId', async (request, reply) => {
			const serviceId = request.params.serviceId;
			const jwt = request.body.jwt;

			const ssoServiceProvider = await this.singleSignOnServiceProviderRepository.findOneBy({ id: serviceId, type: 'jwt' });
			if (!ssoServiceProvider) {
				reply.status(403).send({
					error: {
						message: 'Invalid SSO Service Provider id',
						code: 'INVALID_SSO_SP_ID',
						id: '077e0930-88c1-4f25-bd4e-4da8e34f735b',
						kind: 'client',
					},
				});
				return;
			}

			try {
				if (ssoServiceProvider.cipherAlgorithm) {
					const key = ssoServiceProvider.privateKey
						? await jose.importJWK(JSON.parse(ssoServiceProvider.privateKey))
						: jose.base64url.decode(ssoServiceProvider.publicKey);

					const { payload } = await jose.jwtDecrypt(jwt, key, {
						issuer: ssoServiceProvider.issuer,
						audience: ssoServiceProvider.audience,
					});

					reply.status(200).send({ payload });
					return;
				} else {
					const key = ssoServiceProvider.publicKey.startsWith('{')
						? await jose.importJWK(JSON.parse(ssoServiceProvider.publicKey))
						: jose.base64url.decode(ssoServiceProvider.publicKey);

					const { payload } = await jose.jwtVerify(jwt, key, {
						issuer: ssoServiceProvider.issuer,
						audience: ssoServiceProvider.audience,
					});

					reply.status(200).send({ payload });
					return;
				}
			} catch (err) {
				this.#logger.error('Failed to verify JWT', { error: err });
				const traceableError = err as Error & { code?: string };

				if (traceableError.code) {
					reply.status(400).send({
						error: {
							message: traceableError.message,
							code: traceableError.code,
							id: '843421cf-3ab3-4b1f-ade4-5d5ce1efb6be',
							kind: 'client',
						},
					});
					return;
				}

				reply.status(400).send({
					error: {
						message: 'Invalid JWT',
						code: 'INVALID_JWT',
						id: '39075dbb-03eb-485f-8ee1-f16b625bcc4d',
						kind: 'client',
					},
				});
				return;
			}
		});
	}
}
