/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { Test, TestingModule } from '@nestjs/testing';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { MiUser } from '@/models/User.js';
import { MiUserProfile, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { DI } from '@/di-symbols.js';
import { CoreModule } from '@/core/CoreModule.js';
import { SigninWithPasskeyApiService } from '@/server/api/SigninWithPasskeyApiService.js';
import { RateLimiterService } from '@/server/api/RateLimiterService.js';
import { WebAuthnService } from '@/core/WebAuthnService.js';
import { SigninService } from '@/server/api/SigninService.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import type { ApiEnv } from '@/server/api/ApiServerTypes.js';

class FakeLimiter {
	public async limit() {
		return;
	}
}

class FakeSigninService {
	public signin(..._args: any): any {
		return true;
	}
}

const dummyContextMiddleware = createMiddleware<ApiEnv>(async (ctx, next) => {
	ctx.set('ip', '0.0.0.0');
	ctx.set('ips', ['0.0.0.0']);
	await next();
});

describe('SigninWithPasskeyApiService', () => {
	let app: TestingModule;
	let honoApp: Hono<ApiEnv>;
	let passkeyApiService: SigninWithPasskeyApiService;
	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let webAuthnService: WebAuthnService;
	let idService: IdService;
	let FakeWebauthnVerify: ()=>Promise<string>;

	async function createUser(data: Partial<MiUser> = {}) {
		const user = await usersRepository
			.save({
				...data,
			});
		return user;
	}

	async function createUserProfile(data: Partial<MiUserProfile> = {}) {
		const userProfile = await userProfilesRepository
			.save({ ...data },
			);
		return userProfile;
	}

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
			providers: [
				SigninWithPasskeyApiService,
				{ provide: RateLimiterService, useClass: FakeLimiter },
				{ provide: SigninService, useClass: FakeSigninService },
			],
		}).useMocker((token) => {
			if (typeof token === 'function') {
				return mockDeep<typeof token>();
			}
		}).compile();
		passkeyApiService = app.get<SigninWithPasskeyApiService>(SigninWithPasskeyApiService);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		userProfilesRepository = app.get<UserProfilesRepository>(DI.userProfilesRepository);
		webAuthnService = app.get<WebAuthnService>(WebAuthnService);
		idService = app.get<IdService>(IdService);

		honoApp = new Hono();
		honoApp.post('/signin-with-passkey', dummyContextMiddleware, async (ctx) => {
			const json = await ctx.req.json();
			return passkeyApiService.signin(ctx, json);
		});
	});

	beforeEach(async () => {
		const uid = idService.gen();
		FakeWebauthnVerify = async () => {
			return uid;
		};
		vi.spyOn(webAuthnService, 'verifySignInWithPasskeyAuthentication').mockImplementation(FakeWebauthnVerify);

		const dummyUser = {
			id: uid, username: uid, usernameLower: uid.toLowerCase(), uri: null, host: null,
		 };
		const dummyProfile = {
			userId: uid,
			password: 'qwerty',
			usePasswordLessLogin: true,
		};
		await createUser(dummyUser);
		await createUserProfile(dummyProfile);
	});

	afterAll(async () => {
		await app.close();
	});

	describe('Get Passkey Options', () => {
		it('Should return passkey Auth Options', async () => {
			const res = await honoApp.request('/signin-with-passkey', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: '{}',
			});
			expect(res.status).toBe(200);
			const res_body = await res.json();
			expect(res_body).toHaveProperty('option');
			expect(typeof (res_body as any).context).toBe('string');
		});
	});
	describe('Try Passkey Auth', () => {
		it('Should Success', async () => {
			const res = await honoApp.request('/signin-with-passkey', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ context: 'auth-context', credential: { dummy: [] } as unknown as AuthenticationResponseJSON }),
			});
			expect(res.status).toBe(200);
			const res_body = await res.json();
			expect((res_body as any).signinResponse).toBeDefined();
		});

		it('Should return 400 Without Auth Context', async () => {
			const res = await honoApp.request('/signin-with-passkey', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ credential: { dummy: [] } as unknown as AuthenticationResponseJSON }),
			});
			expect(res.status).toBe(400);
			const res_body = await res.json();
			expect((res_body as any).error?.id).toStrictEqual('1658cc2e-4495-461f-aee4-d403cdf073c1');
		});

		it('Should return 403 When Challenge Verify fail', async () => {
			vi.spyOn(webAuthnService, 'verifySignInWithPasskeyAuthentication')
				.mockImplementation(async () => {
					throw new IdentifiableError('THIS_ERROR_CODE_SHOULD_BE_FORWARDED');
				});
			const res = await honoApp.request('/signin-with-passkey', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ context: 'misskey-1234', credential: { dummy: [] } as unknown as AuthenticationResponseJSON }),
			});
			expect(res.status).toBe(403);
			const res_body = await res.json();
			expect((res_body as any).error?.id).toStrictEqual('THIS_ERROR_CODE_SHOULD_BE_FORWARDED');
		});

		it('Should return 403 When The user not Enabled Passwordless login', async () => {
			const userId = await FakeWebauthnVerify();
			const data = { userId: userId, usePasswordLessLogin: false };
			await userProfilesRepository.update({ userId: userId }, data);
			const res = await honoApp.request('/signin-with-passkey', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ context: 'misskey-1234', credential: { dummy: [] } as unknown as AuthenticationResponseJSON }),
			});
			expect(res.status).toBe(403);
			const res_body = await res.json();
			expect((res_body as any).error?.id).toStrictEqual('2d84773e-f7b7-4d0b-8f72-bb69b584c912');
		});
	});
});
