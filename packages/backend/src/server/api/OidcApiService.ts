/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import * as oidc from 'openid-client';
import { IsNull, QueryFailedError } from 'typeorm';
import { UserAuthService } from '@/core/UserAuthService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import { FastifyReplyError } from '@/misc/fastify-reply-error.js';
import { getIpHash } from '@/misc/get-ip-hash.js';
import { isNativeUserToken } from '@/misc/token.js';
import { RateLimiterService } from './RateLimiterService.js';
import { SigninService } from './SigninService.js';
import type { Config } from '@/config.js';
import type { MiUserProfile, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import type { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import type { Redis } from 'ioredis';
import type { entities } from 'misskey-js';

type Credential = { i?: string | null };
type StartBody = Credential & ({ mode: 'signin' } | ({ mode: 'link' } & entities.OidcAccountAuthorization));
type PendingAuthorization = {
	nonce: string;
	verifier: string;
	account: { userId: string; credentialHash: string } | null;
};
type PendingTotp = { userId: string; identity: string };

const authorizationLifetime = 300;
const totpLifetime = 120;
const callbackPath = '/api/oidc/callback';
const callbackQueryLimit = 8192;
const activeLocalUser = { host: IsNull(), isSuspended: false, isDeleted: false };

// Keep the authorization response out of the main client and its analytics.
const callbackScript = `
	const response = location.search.slice(1);
	history.replaceState(null, '', location.pathname);
	const state = new URLSearchParams(response).get('state');
	if (state && /^[a-zA-Z0-9_-]{43}$/.test(state)) {
		const channel = new BroadcastChannel('misskey:oidc:' + state);
		channel.onmessage = event => {
			if (event.data === 'received') {
				channel.close();
				window.close();
			}
		};
		channel.postMessage(response);
	}
`;
const callbackCspHash = createHash('sha256').update(callbackScript).digest('base64');
const callbackPage = `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OpenID Connect</title>
<p>Close this window and return to Misskey.</p>
<p lang="ja">このウィンドウを閉じて、元の画面に戻ってください。</p>
<script>${callbackScript}</script>
</html>`;

function hash(value: string): string {
	return createHash('sha256').update(value).digest('base64url');
}

function accountCredentialHash(token: string, profile: MiUserProfile): string {
	return hash(JSON.stringify([token, profile.password, profile.twoFactorEnabled, profile.twoFactorSecret]));
}

@Injectable()
export class OidcApiService {
	private provider?: Promise<oidc.Configuration>;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.redis)
		private redis: Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private rateLimiterService: RateLimiterService,
		private signinService: SigninService,
		private userAuthService: UserAuthService,
	) {}

	@bindThis
	public async register(fastify: FastifyInstance, _options: FastifyPluginOptions) {
		fastify.addHook('onRequest', async (_request, reply) => {
			reply.header('Cache-Control', 'no-store');
			reply.header('Referrer-Policy', 'no-referrer');
		});

		fastify.setErrorHandler((error, _request, reply) => {
			if (error instanceof FastifyReplyError) {
				return reply.code(error.statusCode).send({ error: { message: error.message } });
			}
			throw error;
		});

		fastify.post<{ Body: Credential }>('/status', async request => {
			const user = await this.findAccount(request.body?.i);
			const profile = user && await this.userProfilesRepository.findOneBy({ userId: user.id });
			return { enabled: this.config.oidc != null, linked: profile?.oidcIdentity != null };
		});

		fastify.post<{ Body: StartBody }>('/start', async request => await this.start(request));
		fastify.post<{ Body: Credential & entities.OidcFinishRequest }>('/finish', async (request, reply) => await this.finish(request, reply));
		fastify.post<{ Body: Credential & entities.OidcAccountAuthorization }>('/unlink', async (request, reply) => {
			const profile = await this.authorizeAccount(request.body);
			if (profile.oidcIdentity != null) {
				await this.userProfilesRepository.update({
					userId: profile.userId,
					oidcIdentity: profile.oidcIdentity,
				}, { oidcIdentity: null });
			}
			return reply.code(204).send();
		});

		fastify.get('/callback', async (_request, reply) => {
			reply.header('Content-Security-Policy', `default-src 'none'; script-src 'sha256-${callbackCspHash}'; base-uri 'none'; frame-ancestors 'none'`);
			return reply.type('text/html; charset=utf-8').send(callbackPage);
		});
	}

	private async getProvider(): Promise<oidc.Configuration> {
		const settings = this.config.oidc;
		if (settings == null) throw new FastifyReplyError(404, 'OpenID Connect is disabled.');

		this.provider ??= (async () => {
			const issuer = new URL(settings.issuer);
			if (issuer.protocol !== 'https:' || issuer.username || issuer.password || issuer.search || issuer.hash) {
				throw new Error('Invalid OpenID Connect issuer URL.');
			}
			const auth = settings.tokenEndpointAuthMethod === 'client_secret_post'
				? oidc.ClientSecretPost(settings.clientSecret)
				: oidc.ClientSecretBasic(settings.clientSecret);
			const provider = await oidc.discovery(issuer, settings.clientId, { client_secret: settings.clientSecret }, auth);
			if (provider.serverMetadata().issuer !== settings.issuer) {
				throw new Error('Unexpected OpenID Connect issuer.');
			}
			oidc.enableNonRepudiationChecks(provider);
			return provider;
		})().catch(() => {
			this.provider = undefined;
			throw new FastifyReplyError(502, 'OpenID Connect provider discovery failed.');
		});
		return await this.provider;
	}

	private async findAccount(token: unknown): Promise<MiLocalUser | null> {
		if (typeof token !== 'string' || !isNativeUserToken(token)) return null;
		return await this.usersRepository.findOneBy({ ...activeLocalUser, token }) as MiLocalUser | null;
	}

	private async authorizeAccount(body: Credential & entities.OidcAccountAuthorization): Promise<MiUserProfile> {
		const account = await this.findAccount(body?.i);
		if (account == null) throw new FastifyReplyError(403, 'Account authentication failed.');

		const limited = await this.rateLimiterService.limit({ key: 'oidc-reauthenticate', duration: 60 * 60 * 1000, max: 10 }, account.id);
		if (limited != null) throw new FastifyReplyError(429, 'Too many authentication attempts.');

		const profile = await this.userProfilesRepository.findOneBy({ userId: account.id });
		const { password, token } = body;
		if (!profile?.password || typeof password !== 'string' || !await bcrypt.compare(password, profile.password)) {
			throw new FastifyReplyError(403, 'Account authentication failed.');
		}
		await this.verifyTotp(profile, token);
		return profile;
	}

	private async verifyTotp(profile: MiUserProfile, token: unknown) {
		if (!profile.twoFactorEnabled) return;
		if (typeof token !== 'string' || token.length > 64) throw new FastifyReplyError(403, 'Two-factor authentication failed.');

		try {
			await this.userAuthService.twoFactorAuthenticate(profile, token);
		} catch {
			throw new FastifyReplyError(403, 'Two-factor authentication failed.');
		}
	}

	private async limitByIp(request: FastifyRequest, action: 'start' | 'finish') {
		if (!this.config.enableIpRateLimit) return;
		const limited = await this.rateLimiterService.limit({ key: 'oidc-' + action, duration: 60 * 60 * 1000, max: 30, minInterval: 250 }, getIpHash(request.ip));
		if (limited != null) throw new FastifyReplyError(429, 'Too many OpenID Connect requests.');
	}

	private async start(request: FastifyRequest<{ Body: StartBody }>): Promise<entities.OidcStartResponse> {
		await this.limitByIp(request, 'start');
		const body = request.body;
		if (body?.mode !== 'link' && body?.mode !== 'signin') throw new FastifyReplyError(400, 'Invalid OpenID Connect request.');
		const provider = await this.getProvider();

		let account: PendingAuthorization['account'] = null;
		if (body.mode === 'link') {
			const profile = await this.authorizeAccount(body);
			if (profile.oidcIdentity != null) throw new FastifyReplyError(409, 'This account already has an OpenID Connect link.');
			account = { userId: profile.userId, credentialHash: accountCredentialHash(body.i!, profile) };
		}

		const state = oidc.randomState();
		const browserSecret = randomBytes(32).toString('base64url');
		const nonce = oidc.randomNonce();
		const verifier = oidc.randomPKCECodeVerifier();

		const url = oidc.buildAuthorizationUrl(provider, {
			redirect_uri: this.config.url + callbackPath,
			response_type: 'code',
			scope: 'openid',
			state,
			nonce,
			code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
			code_challenge_method: 'S256',
			...(account != null ? { prompt: 'login' } : {}),
		});

		const key = hash(state + browserSecret);
		await this.redis.set('oidc:authorization:' + key, JSON.stringify({ nonce, verifier, account } satisfies PendingAuthorization), 'EX', authorizationLifetime);
		return { url: url.href, state, browserSecret };
	}

	private async finish(request: FastifyRequest<{ Body: Credential & entities.OidcFinishRequest }>, reply: FastifyReply): Promise<entities.OidcFinishResponse> {
		await this.limitByIp(request, 'finish');
		const body = request.body;
		if (typeof body?.state !== 'string' || !/^[\w-]{43}$/.test(body.state) ||
			typeof body.browserSecret !== 'string' || !/^[\w-]{43}$/.test(body.browserSecret)) {
			throw new FastifyReplyError(400, 'Invalid OpenID Connect request.');
		}

		const provider = await this.getProvider();
		const key = hash(body.state + body.browserSecret);
		if ('token' in body) {
			const stored = await this.redis.getdel('oidc:totp:' + key);
			if (stored == null) throw new FastifyReplyError(403, 'OpenID Connect authentication expired.');
			const { userId, identity } = JSON.parse(stored) as PendingTotp;
			const { user, profile } = await this.linkedAccount(identity);
			if (user.id !== userId) throw new FastifyReplyError(403, 'The OpenID Connect link has changed.');
			await this.verifyTotp(profile, body.token);
			return { result: 'signedIn', signin: this.signinService.signin(request, reply, user) };
		}

		if (typeof body.authorizationResponse !== 'string' || body.authorizationResponse.length > callbackQueryLimit) throw new FastifyReplyError(400, 'Invalid OpenID Connect response.');
		const stored = await this.redis.getdel('oidc:authorization:' + key);
		if (stored == null) throw new FastifyReplyError(403, 'OpenID Connect authentication expired.');
		const pending = JSON.parse(stored) as PendingAuthorization;

		const callback = new URL(callbackPath, this.config.url);
		callback.search = body.authorizationResponse;
		const tokens = await oidc.authorizationCodeGrant(provider, callback, {
			expectedState: body.state,
			expectedNonce: pending.nonce,
			pkceCodeVerifier: pending.verifier,
		}).catch(() => {
			throw new FastifyReplyError(403, 'OpenID Connect authentication failed.');
		});
		const claims = tokens.claims();
		if (!claims?.sub) throw new FastifyReplyError(403, 'OpenID Connect authentication failed.');
		const identity = hash(JSON.stringify([claims.iss, claims.sub]));

		if (pending.account != null) {
			const user = await this.findAccount(body.i);
			const profile = user && await this.userProfilesRepository.findOneBy({ userId: user.id });
			if (user?.id !== pending.account.userId || user.token == null || profile?.password == null ||
				accountCredentialHash(user.token, profile) !== pending.account.credentialHash) {
				throw new FastifyReplyError(403, 'The Misskey account has changed.');
			}

			try {
				const updated = await this.userProfilesRepository.update({
					userId: user.id,
					oidcIdentity: IsNull(),
					password: profile.password,
					twoFactorEnabled: profile.twoFactorEnabled,
					twoFactorSecret: profile.twoFactorSecret ?? IsNull(),
				}, { oidcIdentity: identity });
				if (!updated.affected) throw new FastifyReplyError(409, 'This account already has an OpenID Connect link.');
			} catch (error) {
				if (error instanceof QueryFailedError && 'constraint' in error.driverError &&
					error.driverError.constraint === 'IDX_user_profile_oidc_identity') {
					throw new FastifyReplyError(409, 'This OpenID Connect identity is already linked.');
				}
				throw error;
			}
			return { result: 'linked' };
		}

		const { user, profile } = await this.linkedAccount(identity);
		if (profile.twoFactorEnabled) {
			await this.redis.set('oidc:totp:' + key, JSON.stringify({ userId: user.id, identity } satisfies PendingTotp), 'EX', totpLifetime);
			return { result: 'totp' };
		}

		return { result: 'signedIn', signin: this.signinService.signin(request, reply, user) };
	}

	private async linkedAccount(identity: string): Promise<{ user: MiLocalUser; profile: MiUserProfile }> {
		const profile = await this.userProfilesRepository.findOneBy({ oidcIdentity: identity });
		const user = profile && await this.usersRepository.findOneBy({ ...activeLocalUser, id: profile.userId }) as MiLocalUser | null;
		if (profile == null || user?.token == null) throw new FastifyReplyError(403, 'No active account is linked to this OpenID Connect identity.');
		return { user, profile };
	}
}
