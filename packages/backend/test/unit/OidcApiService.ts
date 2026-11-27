/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import bcrypt from 'bcryptjs';
import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { OidcApiService } from '@/server/api/OidcApiService.js';
import type { Config } from '@/config.js';
import type { UserAuthService } from '@/core/UserAuthService.js';
import type { MiLocalUser } from '@/models/User.js';
import type { MiUserProfile, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import type { RateLimiterService } from '@/server/api/RateLimiterService.js';
import type { SigninService } from '@/server/api/SigninService.js';
import type { Redis } from 'ioredis';
import type { entities } from 'misskey-js';

const issuer = 'https://identity.example.test';
const url = 'https://misskey.example.test';
const clientId = 'misskey-test';
const password = 'test-password';
const accountToken = '1234567890abcdef';
const identityHash = createHash('sha256').update(JSON.stringify([issuer, 'subject'])).digest('base64url');
const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });

function idToken(nonce: string, subject: string) {
	const now = Math.floor(Date.now() / 1000);
	const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url');
	const claims = Buffer.from(JSON.stringify({ iss: issuer, aud: clientId, sub: subject, nonce, iat: now, exp: now + 60 })).toString('base64url');
	const message = header + '.' + claims;
	return message + '.' + sign('sha256', Buffer.from(message), privateKey).toString('base64url');
}

describe('OpenID Connect account linking', () => {
	let app: ReturnType<typeof Fastify>;
	let profile: MiUserProfile;
	let account: MiLocalUser;
	let authorization: URL;
	let tokenNonce: string | null;
	let tokenSubject: string;
	let signatureValid: boolean;
	let userAuth: ReturnType<typeof mockDeep<UserAuthService>>;
	let signin: ReturnType<typeof mockDeep<SigninService>>;

	beforeEach(async () => {
		app = Fastify();
		account = { id: 'local-account', token: accountToken } as MiLocalUser;
		profile = { userId: account.id, password: await bcrypt.hash(password, 4), oidcIdentity: null, twoFactorEnabled: false } as MiUserProfile;
		tokenNonce = null;
		tokenSubject = 'subject';
		signatureValid = true;

		const users = mockDeep<UsersRepository>();
		users.findOneBy.mockImplementation(async where => {
			if (Array.isArray(where) || where.isSuspended !== false || where.isDeleted !== false || account.isSuspended) return null;
			return where.token === account.token || where.id === account.id ? account : null;
		});
		const profiles = mockDeep<UserProfilesRepository>();
		profiles.findOneBy.mockImplementation(async where => {
			if (Array.isArray(where)) return null;
			return where.userId === profile.userId || where.oidcIdentity === profile.oidcIdentity ? profile : null;
		});
		profiles.update.mockImplementation(async (_, update) => {
			profile.oidcIdentity = update.oidcIdentity as string | null;
			return { affected: 1, raw: [], generatedMaps: [] };
		});

		const pending = new Map<string, string>();
		const redis = mockDeep<Redis>();
		redis.set.mockImplementation(async (key, value) => {
			pending.set(String(key), String(value));
			return 'OK';
		});
		redis.getdel.mockImplementation(async key => {
			const value = pending.get(String(key));
			pending.delete(String(key));
			return value ?? null;
		});

		vi.stubGlobal('fetch', vi.fn(async (input: string, options: RequestInit) => {
			switch (new URL(input).pathname) {
				case '/.well-known/openid-configuration':
					return Response.json({
						issuer,
						authorization_endpoint: issuer + '/authorize',
						token_endpoint: issuer + '/token',
						jwks_uri: issuer + '/jwks',
					});
				case '/token': {
					const params = new URLSearchParams(String(options.body));
					expect(params.get('redirect_uri')).toBe(url + '/api/oidc/callback');
					expect(createHash('sha256').update(params.get('code_verifier')!).digest('base64url')).toBe(authorization.searchParams.get('code_challenge'));
					const token = idToken(tokenNonce ?? authorization.searchParams.get('nonce')!, tokenSubject);
					return Response.json({
						access_token: 'provider-access-token',
						token_type: 'Bearer',
						id_token: signatureValid ? token : token.replace(/[^.]+$/, Buffer.alloc(256).toString('base64url')),
					});
				}
				case '/jwks':
					return Response.json({ keys: [{ ...publicKey.export({ format: 'jwk' }), alg: 'RS256', kid: 'test-key' }] });
				default:
					throw new Error('Unexpected request to ' + input);
			}
		}));

		userAuth = mockDeep<UserAuthService>();
		signin = mockDeep<SigninService>();
		signin.signin.mockReturnValue({ finished: true, id: account.id, i: accountToken });
		const service = new OidcApiService(
			mockDeep<Config>({ url, oidc: { issuer, clientId, clientSecret: 'test-secret' }, enableIpRateLimit: false }),
			redis,
			users,
			profiles,
			mockDeep<RateLimiterService>(),
			signin,
			userAuth,
		);
		await app.register(service.register, { prefix: '/api/oidc' });
	});

	afterEach(async () => {
		await app.close();
		vi.unstubAllGlobals();
	});

	function post(path: string, payload: object) {
		return app.inject({ method: 'POST', url: '/api/oidc/' + path, payload });
	}

	async function start(mode: 'link' | 'signin') {
		const response = await post('start', mode === 'link' ? { mode, i: accountToken, password, token: '123456' } : { mode });
		expect(response.statusCode, response.body).toBe(200);
		const context = response.json() as entities.OidcStartResponse;
		authorization = new URL(context.url);
		expect(authorization.searchParams.get('scope')).toBe('openid');
		expect(authorization.searchParams.get('code_challenge_method')).toBe('S256');
		return {
			state: context.state,
			browserSecret: context.browserSecret,
			authorizationResponse: new URLSearchParams({ state: context.state, code: 'test-code' }).toString(),
		};
	}

	it('links with account reauthentication, signs in, and stops signing in after unlink', async () => {
		expect((await post('start', { mode: 'link', i: accountToken, password: 'wrong' })).statusCode).toBe(403);
		const link = await start('link');
		expect((await post('finish', { ...link, i: accountToken })).json()).toEqual({ result: 'linked' });
		expect(profile.oidcIdentity).toBe(identityHash);
		expect((await post('status', { i: accountToken })).json()).toEqual({ enabled: true, linked: true });

		const login = await start('signin');
		expect((await post('finish', login)).json()).toMatchObject({ result: 'signedIn', signin: { id: account.id } });
		expect((await post('finish', login)).statusCode).toBe(403);

		expect((await post('unlink', { i: accountToken, password })).statusCode).toBe(204);
		expect((await post('finish', await start('signin'))).statusCode).toBe(403);
	});

	it('binds the callback to the initiating browser and the initiating Misskey account', async () => {
		const link = await start('link');
		expect((await post('finish', { ...link, browserSecret: 'x'.repeat(43), i: accountToken })).statusCode).toBe(403);
		expect((await post('finish', link)).statusCode).toBe(403);
		expect((await post('finish', { ...link, i: accountToken })).statusCode).toBe(403);
		expect(profile.oidcIdentity).toBeNull();
	});

	it('rejects a mismatched nonce and an unlinked subject', async () => {
		profile.oidcIdentity = identityHash;
		tokenNonce = 'wrong-nonce';
		expect((await post('finish', await start('signin'))).statusCode).toBe(403);
		tokenNonce = null;
		tokenSubject = 'other-subject';
		expect((await post('finish', await start('signin'))).statusCode).toBe(403);
		expect(signin.signin).not.toHaveBeenCalled();
	});

	it('rejects a pending link after the account password changes', async () => {
		const link = await start('link');
		profile.password = await bcrypt.hash('changed-password', 4);
		expect((await post('finish', { ...link, i: accountToken })).statusCode).toBe(403);
		expect(profile.oidcIdentity).toBeNull();
	});

	it('rejects an ID token with an invalid signature', async () => {
		profile.oidcIdentity = identityHash;
		signatureValid = false;
		expect((await post('finish', await start('signin'))).statusCode).toBe(403);
		expect(signin.signin).not.toHaveBeenCalled();
	});

	it('requires the existing two-factor authentication before signing in', async () => {
		profile.oidcIdentity = identityHash;
		profile.twoFactorEnabled = true;
		const { authorizationResponse, ...context } = await start('signin');
		expect((await post('finish', { ...context, authorizationResponse })).json()).toEqual({ result: 'totp' });
		expect(signin.signin).not.toHaveBeenCalled();
		expect((await post('finish', { ...context, token: '123456' })).json()).toMatchObject({ result: 'signedIn' });
		expect(userAuth.twoFactorAuthenticate).toHaveBeenCalledWith(profile, '123456');
		expect((await post('finish', { ...context, token: '123456' })).statusCode).toBe(403);
	});

	it('does not sign in after two-factor authentication fails', async () => {
		profile.oidcIdentity = identityHash;
		profile.twoFactorEnabled = true;
		userAuth.twoFactorAuthenticate.mockRejectedValue(new Error('authentication failed'));
		const { authorizationResponse, ...context } = await start('signin');
		expect((await post('finish', { ...context, authorizationResponse })).json()).toEqual({ result: 'totp' });
		expect((await post('finish', { ...context, token: '000000' })).statusCode).toBe(403);
		expect(signin.signin).not.toHaveBeenCalled();
	});

	it('denies sign-in to a suspended account', async () => {
		profile.oidcIdentity = identityHash;
		account.isSuspended = true;
		expect((await post('finish', await start('signin'))).statusCode).toBe(403);
		expect(signin.signin).not.toHaveBeenCalled();
	});

	it('serves a standalone callback that keeps the authorization response out of the app', async () => {
		const { authorizationResponse } = await start('signin');
		const response = await app.inject({ method: 'GET', url: '/api/oidc/callback?' + authorizationResponse });
		expect(response.statusCode).toBe(200);
		expect(response.body).not.toContain(authorizationResponse);
		expect(response.headers['content-security-policy']).toContain("default-src 'none'");
		expect(response.headers['cache-control']).toBe('no-store');
		expect(response.headers['referrer-policy']).toBe('no-referrer');
	});
});
