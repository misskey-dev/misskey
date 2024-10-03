/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IncomingHttpHeaders } from 'node:http';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthenticationResponseJSON } from '@simplewebauthn/types';
import { HttpHeader } from 'fastify/types/utils.js';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
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

const moduleMocker = new ModuleMocker(global);

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

class DummyFastifyReply {
	public statusCode: number;
	code(num: number): void {
		this.statusCode = num;
	}
	header(_key: HttpHeader, _value: any): void {
	}
}
class DummyFastifyRequest {
	public ip: string;
	public body: {credential: any, context: string};
	public headers: IncomingHttpHeaders = { 'accept': 'application/json' };
	constructor(body?: any) {
		this.ip = '0.0.0.0';
		this.body = body;
	}
}

type ApiFastifyRequestType = FastifyRequest<{
	Body: {
		credential?: AuthenticationResponseJSON;
		context?: string;
	};
}>;

describe('SigninWithPasskeyApiService', () => {
	let app: TestingModule;
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
				const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
				const Mock = moduleMocker.generateFromMetadata(mockMetadata);
				return new Mock();
			}
		}).compile();
		passkeyApiService = app.get<SigninWithPasskeyApiService>(SigninWithPasskeyApiService);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		userProfilesRepository = app.get<UserProfilesRepository>(DI.userProfilesRepository);
		webAuthnService = app.get<WebAuthnService>(WebAuthnService);
		idService = app.get<IdService>(IdService);
	});

	beforeEach(async () => {
		const uid = idService.gen();
		FakeWebauthnVerify = async () => {
			return uid;
		};
		jest.spyOn(webAuthnService, 'verifySignInWithPasskeyAuthentication').mockImplementation(FakeWebauthnVerify);

		const dummyUser = {
			id: uid, username: uid, usernameLower: uid.toLocaleLowerCase(), uri: null, host: null,
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
			const req = new DummyFastifyRequest({}) as ApiFastifyRequestType;
			const res = new DummyFastifyReply() as unknown as FastifyReply;
			const res_body = await passkeyApiService.signin(req, res);
			expect(res.statusCode).toBe(200);
			expect((res_body as any).option).toBeDefined();
			expect(typeof (res_body as any).context).toBe('string');
		});
	});
	describe('Try Passkey Auth', () => {
		it('Should Success', async () => {
			const req = new DummyFastifyRequest({ context: 'auth-context', credential: { dummy: [] } }) as ApiFastifyRequestType;
			const res = new DummyFastifyReply() as FastifyReply;
			const res_body = await passkeyApiService.signin(req, res);
			expect((res_body as any).signinResponse).toBeDefined();
		});

		it('Should return 400 Without Auth Context', async () => {
			const req = new DummyFastifyRequest({ credential: { dummy: [] } }) as ApiFastifyRequestType;
			const res = new DummyFastifyReply() as FastifyReply;
			const res_body = await passkeyApiService.signin(req, res);
			expect(res.statusCode).toBe(400);
			expect((res_body as any).error?.id).toStrictEqual('1658cc2e-4495-461f-aee4-d403cdf073c1');
		});

		it('Should return 403 When Challenge Verify fail', async () => {
			const req = new DummyFastifyRequest({ context: 'misskey-1234', credential: { dummy: [] } }) as ApiFastifyRequestType;
			const res = new DummyFastifyReply() as FastifyReply;
			jest.spyOn(webAuthnService, 'verifySignInWithPasskeyAuthentication')
				.mockImplementation(async () => {
					throw new IdentifiableError('THIS_ERROR_CODE_SHOULD_BE_FORWARDED');
				});
			const res_body = await passkeyApiService.signin(req, res);
			expect(res.statusCode).toBe(403);
			expect((res_body as any).error?.id).toStrictEqual('THIS_ERROR_CODE_SHOULD_BE_FORWARDED');
		});

		it('Should return 403 When The user not Enabled Passwordless login', async () => {
			const req = new DummyFastifyRequest({ context: 'misskey-1234', credential: { dummy: [] } }) as ApiFastifyRequestType;
			const res = new DummyFastifyReply() as FastifyReply;
			const userId = await FakeWebauthnVerify();
			const data = { userId: userId, usePasswordLessLogin: false };
			await userProfilesRepository.update({ userId: userId }, data);
			const res_body = await passkeyApiService.signin(req, res);
			expect(res.statusCode).toBe(403);
			expect((res_body as any).error?.id).toStrictEqual('2d84773e-f7b7-4d0b-8f72-bb69b584c912');
		});
	});
});
