/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type {
	MiUserProfile,
	SigninsRepository,
	UserProfilesRepository,
	UsersRepository,
} from '@/models/_.js';
import type { Config } from '@/config.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import type { MiLocalUser } from '@/models/User.js';
import { IdService } from '@/core/IdService.js';
import { bindThis } from '@/decorators.js';
import { WebAuthnService } from '@/core/WebAuthnService.js';
import { UserAuthService } from '@/core/UserAuthService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { CaptchaService } from '@/core/CaptchaService.js';
import { FastifyReplyError } from '@/misc/fastify-reply-error.js';
import { MetaService } from '@/core/MetaService.js';
import { RateLimiterService } from './RateLimiterService.js';
import { SigninService } from './SigninService.js';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { FastifyReply, FastifyRequest } from 'fastify';

@Injectable()
export class SigninApiService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private idService: IdService,
		private loggerService: LoggerService,
		private rateLimiterService: RateLimiterService,
		private signinService: SigninService,
		private userAuthService: UserAuthService,
		private webAuthnService: WebAuthnService,
		private metaService: MetaService,
		private captchaService: CaptchaService,
	) {
	}

	@bindThis
	public async signin(
		request: FastifyRequest<{
			Body: {
				username: string;
				password: string;
				token?: string;
				credential?: AuthenticationResponseJSON;
				'hcaptcha-response'?: string;
				'g-recaptcha-response'?: string;
				'turnstile-response'?: string;
				'm-captcha-response'?: string;
			};
		}>,
		reply: FastifyReply,
	) {
		const logger = this.loggerService.getLogger('api:signin');
		logger.setContext({ username: request.body.username, ip: request.ip, headers: request.headers, span: request.headers['x-client-transaction-id'] ?? randomUUID() });
		logger.info('Requested to sign in.');

		reply.header('Access-Control-Allow-Origin', this.config.url);
		reply.header('Access-Control-Allow-Credentials', 'true');

		const body = request.body;
		const username = body['username'];
		const password = body['password'];
		const token = body['token'];

		function error(status: number, error: { id: string }) {
			reply.code(status);
			return { error };
		}

		try {
		// not more than 1 attempt per second and not more than 10 attempts per hour
			await this.rateLimiterService.limit({ key: 'signin', duration: 60 * 60 * 1000, max: 10, minInterval: 1000 }, getIpHash(request.ip));
		} catch (err) {
			logger.warn('Too many failed attempts to sign in.');
			reply.code(429);
			return {
				error: {
					message: 'Too many failed attempts to sign in. Try again later.',
					code: 'TOO_MANY_AUTHENTICATION_FAILURES',
					id: '22d05606-fbcf-421a-a2db-b32610dcfd1b',
				},
			};
		}

		if (typeof username !== 'string') {
			logger.warn('Invalid parameter: username is not a string.');
			reply.code(400);
			return;
		}

		if (typeof password !== 'string') {
			logger.warn('Invalid parameter: password is not a string.');
			reply.code(400);
			return;
		}

		if (token != null && typeof token !== 'string') {
			logger.warn('Invalid parameter: token is not a string.');
			reply.code(400);
			return;
		}

		// Fetch user
		const profile = await this.userProfilesRepository.findOne({
			relations: ['user'],
			where: username.includes('@') ? {
				email: username,
				emailVerified: true,
				user: {
					host: IsNull(),
				}
			} : {
				user: {
					usernameLower: username.toLowerCase(),
					host: IsNull(),
				}
			}
		});
		const user = (profile?.user as MiLocalUser) ?? null;

		if (!user || !profile) {
			logger.error('No such user.');
			return error(403, {
				id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
			});
		}

		if (user.isDeleted && user.isSuspended) {
			logger.error('No such user. (logical deletion)');
			return error(403, {
				id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
			});
		}

		if (user.isSuspended) {
			logger.error('User is suspended.');
			return error(403, {
				id: 'e03a5f46-d309-4865-9b69-56282d94e1eb',
			});
		}

		// Compare password
		const same = await bcrypt.compare(password, profile.password!);

		const fail = async (status?: number, failure?: { id: string }) => {
			// Append signin history
			await this.signinsRepository.insert({
				id: this.idService.gen(),
				userId: user.id,
				ip: request.ip,
				headers: request.headers as any,
				success: false,
			});

			return error(status ?? 500, failure ?? { id: '4e30e80c-e338-45a0-8c8f-44455efa3b76' });
		};

		if (!profile.twoFactorEnabled) {
			if (process.env.NODE_ENV !== 'test') {
				const meta = await this.metaService.fetch();
				if (meta.enableHcaptcha && meta.hcaptchaSecretKey) {
					await this.captchaService.verifyHcaptcha(meta.hcaptchaSecretKey, body['hcaptcha-response']).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}

				if (meta.enableMcaptcha && meta.mcaptchaSecretKey && meta.mcaptchaSitekey && meta.mcaptchaInstanceUrl) {
					await this.captchaService.verifyMcaptcha(meta.mcaptchaSecretKey, meta.mcaptchaSitekey, meta.mcaptchaInstanceUrl, body['m-captcha-response']).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}

				if (meta.enableRecaptcha && meta.recaptchaSecretKey) {
					await this.captchaService.verifyRecaptcha(meta.recaptchaSecretKey, body['g-recaptcha-response']).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}

				if (meta.enableTurnstile && meta.turnstileSecretKey) {
					await this.captchaService.verifyTurnstile(meta.turnstileSecretKey, body['turnstile-response']).catch(err => {
						throw new FastifyReplyError(400, err);
					});
				}
			}

			if (same) {
				logger.info('Successfully signed in with password.');
				return this.signinService.signin(request, reply, user);
			} else {
				logger.error('Invalid request: incorrect password.');
				return await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
			}
		}

		if (token) {
			if (!same) {
				logger.error('Invalid request: incorrect password.');
				return await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
			}

			try {
				await this.userAuthService.twoFactorAuthenticate(profile, token);
			} catch (e) {
				logger.error('Invalid request: Unable to authenticate with two-factor token.');
				return await fail(403, {
					id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f',
				});
			}

			logger.info('Successfully signed in with password and two-factor token.');
			return this.signinService.signin(request, reply, user);
		} else if (body.credential) {
			if (!same && !profile.usePasswordLessLogin) {
				logger.error('Invalid request: incorrect password.');
				return await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
			}

			const authorized = await this.webAuthnService.verifyAuthentication(user.id, body.credential);

			if (authorized) {
				logger.info('Successfully signed in with WebAuthn authentication.');
				return this.signinService.signin(request, reply, user);
			} else {
				logger.error('Invalid request: Unable to authenticate with WebAuthn credential.');
				return await fail(403, {
					id: '93b86c4b-72f9-40eb-9815-798928603d1e',
				});
			}
		} else {
			if (!same && !profile.usePasswordLessLogin) {
				logger.error('Invalid request: incorrect password.');
				return await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
			}

			const authRequest = await this.webAuthnService.initiateAuthentication(user.id);

			logger.info('Successfully initiated WebAuthn authentication.');
			reply.code(200);
			return authRequest;
		}
		// never get here
	}
}
