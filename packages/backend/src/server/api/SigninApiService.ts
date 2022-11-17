import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import * as speakeasy from 'speakeasy';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { UserSecurityKeysRepository, SigninsRepository, UserProfilesRepository, AttestationChallengesRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import type { ILocalUser } from '@/models/entities/User.js';
import { IdService } from '@/core/IdService.js';
import { TwoFactorAuthenticationService } from '@/core/TwoFactorAuthenticationService.js';
import { RateLimiterService } from './RateLimiterService.js';
import { SigninService } from './SigninService.js';
import type Koa from 'koa';

@Injectable()
export class SigninApiService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.attestationChallengesRepository)
		private attestationChallengesRepository: AttestationChallengesRepository,

		@Inject(DI.signinsRepository)
		private signinsRepository: SigninsRepository,

		private idService: IdService,
		private rateLimiterService: RateLimiterService,
		private signinService: SigninService,
		private twoFactorAuthenticationService: TwoFactorAuthenticationService,
	) {
	}

	public async signin(ctx: Koa.Context) {
		ctx.set('Access-Control-Allow-Origin', this.config.url);
		ctx.set('Access-Control-Allow-Credentials', 'true');

		const body = ctx.request.body as any;
		const username = body['username'];
		const password = body['password'];
		const token = body['token'];

		function error(status: number, error: { id: string }) {
			ctx.status = status;
			ctx.body = { error };
		}

		try {
		// not more than 1 attempt per second and not more than 10 attempts per hour
			await this.rateLimiterService.limit({ key: 'signin', duration: 60 * 60 * 1000, max: 10, minInterval: 1000 }, getIpHash(ctx.ip));
		} catch (err) {
			ctx.status = 429;
			ctx.body = {
				error: {
					message: 'Too many failed attempts to sign in. Try again later.',
					code: 'TOO_MANY_AUTHENTICATION_FAILURES',
					id: '22d05606-fbcf-421a-a2db-b32610dcfd1b',
				},
			};
			return;
		}

		if (typeof username !== 'string') {
			ctx.status = 400;
			return;
		}

		if (typeof password !== 'string') {
			ctx.status = 400;
			return;
		}

		if (token != null && typeof token !== 'string') {
			ctx.status = 400;
			return;
		}

		// Fetch user
		const user = await this.usersRepository.findOneBy({
			usernameLower: username.toLowerCase(),
			host: IsNull(),
		}) as ILocalUser;

		if (user == null) {
			error(404, {
				id: '6cc579cc-885d-43d8-95c2-b8c7fc963280',
			});
			return;
		}

		if (user.isSuspended) {
			error(403, {
				id: 'e03a5f46-d309-4865-9b69-56282d94e1eb',
			});
			return;
		}

		const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

		// Compare password
		const same = await bcrypt.compare(password, profile.password!);

		const fail = async (status?: number, failure?: { id: string }) => {
		// Append signin history
			await this.signinsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: user.id,
				ip: ctx.ip,
				headers: ctx.headers,
				success: false,
			});

			error(status ?? 500, failure ?? { id: '4e30e80c-e338-45a0-8c8f-44455efa3b76' });
		};

		if (!profile.twoFactorEnabled) {
			if (same) {
				this.signinService.signin(ctx, user);
				return;
			} else {
				await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
				return;
			}
		}

		if (token) {
			if (!same) {
				await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
				return;
			}

			const verified = (speakeasy as any).totp.verify({
				secret: profile.twoFactorSecret,
				encoding: 'base32',
				token: token,
				window: 2,
			});

			if (verified) {
				this.signinService.signin(ctx, user);
				return;
			} else {
				await fail(403, {
					id: 'cdf1235b-ac71-46d4-a3a6-84ccce48df6f',
				});
				return;
			}
		} else if (body.credentialId) {
			if (!same && !profile.usePasswordLessLogin) {
				await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
				return;
			}

			const clientDataJSON = Buffer.from(body.clientDataJSON, 'hex');
			const clientData = JSON.parse(clientDataJSON.toString('utf-8'));
			const challenge = await this.attestationChallengesRepository.findOneBy({
				userId: user.id,
				id: body.challengeId,
				registrationChallenge: false,
				challenge: this.twoFactorAuthenticationService.hash(clientData.challenge).toString('hex'),
			});

			if (!challenge) {
				await fail(403, {
					id: '2715a88a-2125-4013-932f-aa6fe72792da',
				});
				return;
			}

			await this.attestationChallengesRepository.delete({
				userId: user.id,
				id: body.challengeId,
			});

			if (new Date().getTime() - challenge.createdAt.getTime() >= 5 * 60 * 1000) {
				await fail(403, {
					id: '2715a88a-2125-4013-932f-aa6fe72792da',
				});
				return;
			}

			const securityKey = await this.userSecurityKeysRepository.findOneBy({
				id: Buffer.from(
					body.credentialId
						.replace(/-/g, '+')
						.replace(/_/g, '/'),
					'base64',
				).toString('hex'),
			});

			if (!securityKey) {
				await fail(403, {
					id: '66269679-aeaf-4474-862b-eb761197e046',
				});
				return;
			}

			const isValid = this.twoFactorAuthenticationService.verifySignin({
				publicKey: Buffer.from(securityKey.publicKey, 'hex'),
				authenticatorData: Buffer.from(body.authenticatorData, 'hex'),
				clientDataJSON,
				clientData,
				signature: Buffer.from(body.signature, 'hex'),
				challenge: challenge.challenge,
			});

			if (isValid) {
				this.signinService.signin(ctx, user);
				return;
			} else {
				await fail(403, {
					id: '93b86c4b-72f9-40eb-9815-798928603d1e',
				});
				return;
			}
		} else {
			if (!same && !profile.usePasswordLessLogin) {
				await fail(403, {
					id: '932c904e-9460-45b7-9ce6-7ed33be7eb2c',
				});
				return;
			}

			const keys = await this.userSecurityKeysRepository.findBy({
				userId: user.id,
			});

			if (keys.length === 0) {
				await fail(403, {
					id: 'f27fd449-9af4-4841-9249-1f989b9fa4a4',
				});
				return;
			}

			// 32 byte challenge
			const challenge = randomBytes(32).toString('base64')
				.replace(/=/g, '')
				.replace(/\+/g, '-')
				.replace(/\//g, '_');

			const challengeId = this.idService.genId();

			await this.attestationChallengesRepository.insert({
				userId: user.id,
				id: challengeId,
				challenge: this.twoFactorAuthenticationService.hash(Buffer.from(challenge, 'utf-8')).toString('hex'),
				createdAt: new Date(),
				registrationChallenge: false,
			});

			ctx.body = {
				challenge,
				challengeId,
				securityKeys: keys.map(key => ({
					id: key.id,
				})),
			};
			ctx.status = 200;
			return;
		}
	// never get here
	}
}

