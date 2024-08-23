/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, describe, jest } from '@jest/globals';
import { WebhookTestService } from '@/core/WebhookTestService.js';
import { UserWebhookService } from '@/core/UserWebhookService.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { MiSystemWebhook, MiUser, MiWebhook, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

describe('WebhookTestService', () => {
	let app: TestingModule;
	let service: WebhookTestService;

	// --------------------------------------------------------------------------------------

	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let userWebhookService: jest.Mocked<UserWebhookService>;
	let systemWebhookService: jest.Mocked<SystemWebhookService>;
	let idService: IdService;

	let root: MiUser;
	let alice: MiUser;

	async function createUser(data: Partial<MiUser> = {}) {
		const user = await usersRepository
			.insert({
				id: idService.gen(),
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.insert({
			userId: user.id,
		});

		return user;
	}

	// --------------------------------------------------------------------------------------

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				WebhookTestService,
				IdService,
				{
					provide: UserWebhookService, useFactory: () => ({
						enqueueUserWebhook: jest.fn(),
						getActiveWebhooks: jest.fn(),
					}),
				},
				{
					provide: SystemWebhookService, useFactory: () => ({
						enqueueSystemWebhook: jest.fn(),
						fetchActiveSystemWebhooks: jest.fn(),
					}),
				},
			],
		}).compile();

		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);

		service = app.get(WebhookTestService);
		idService = app.get(IdService);
		userWebhookService = app.get(UserWebhookService) as jest.Mocked<UserWebhookService>;
		systemWebhookService = app.get(SystemWebhookService) as jest.Mocked<SystemWebhookService>;

		app.enableShutdownHooks();
	});

	beforeEach(async () => {
		root = await createUser({ username: 'root', usernameLower: 'root', isRoot: true });
		alice = await createUser({ username: 'alice', usernameLower: 'alice', isRoot: false });

		userWebhookService.getActiveWebhooks.mockReturnValue(Promise.resolve([
			{ id: 'dummy-webhook', active: true, userId: alice.id } as MiWebhook,
		]));
		systemWebhookService.fetchActiveSystemWebhooks.mockReturnValue(Promise.resolve([
			{ id: 'dummy-webhook', isActive: true } as MiSystemWebhook,
		]));
	});

	afterEach(async () => {
		userWebhookService.enqueueUserWebhook.mockClear();
		userWebhookService.getActiveWebhooks.mockClear();
		systemWebhookService.enqueueSystemWebhook.mockClear();
		systemWebhookService.fetchActiveSystemWebhooks.mockClear();

		await usersRepository.delete({});
		await userProfilesRepository.delete({});
	});

	afterAll(async () => {
		await app.close();
	});

	// --------------------------------------------------------------------------------------

	describe('testUserWebhook', () => {
		test('note', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'note' }, alice);

			const calls = userWebhookService.enqueueUserWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('note');
			expect((calls[2] as any).id).toBe('dummy-note-1');
		});

		test('reply', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'reply' }, alice);

			const calls = userWebhookService.enqueueUserWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('reply');
			expect((calls[2] as any).id).toBe('dummy-reply-1');
		});

		test('renote', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'renote' }, alice);

			const calls = userWebhookService.enqueueUserWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('renote');
			expect((calls[2] as any).id).toBe('dummy-renote-1');
		});

		test('mention', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'mention' }, alice);

			const calls = userWebhookService.enqueueUserWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('mention');
			expect((calls[2] as any).id).toBe('dummy-mention-1');
		});

		test('follow', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'follow' }, alice);

			const calls = userWebhookService.enqueueUserWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('follow');
			expect((calls[2] as any).id).toBe('dummy-user-1');
		});

		test('followed', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'followed' }, alice);

			const calls = userWebhookService.enqueueUserWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('followed');
			expect((calls[2] as any).id).toBe('dummy-user-2');
		});

		test('unfollow', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'unfollow' }, alice);

			const calls = userWebhookService.enqueueUserWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('unfollow');
			expect((calls[2] as any).id).toBe('dummy-user-3');
		});

		describe('NoSuchActiveWebhookError', () => {
			test('throw', async () => {
				userWebhookService.getActiveWebhooks.mockClear();
				userWebhookService.getActiveWebhooks.mockReturnValue(Promise.resolve([
					{ id: 'dummy-webhook', active: false } as MiWebhook,
				]));

				await expect(service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'note' }, root))
					.rejects.toThrow(WebhookTestService.NoSuchActiveWebhookError);
			});
		});
	});

	describe('testSystemWebhook', () => {
		test('abuseReport', async () => {
			await service.testSystemWebhook({ webhookId: 'dummy-webhook', type: 'abuseReport' });

			const calls = systemWebhookService.enqueueSystemWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('abuseReport');
			expect((calls[2] as any).id).toBe('dummy-abuse-report1');
			expect((calls[2] as any).resolved).toBe(false);
		});

		test('abuseReportResolved', async () => {
			await service.testSystemWebhook({ webhookId: 'dummy-webhook', type: 'abuseReportResolved' });

			const calls = systemWebhookService.enqueueSystemWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('abuseReportResolved');
			expect((calls[2] as any).id).toBe('dummy-abuse-report1');
			expect((calls[2] as any).resolved).toBe(true);
		});

		test('userCreated', async () => {
			await service.testSystemWebhook({ webhookId: 'dummy-webhook', type: 'userCreated' });

			const calls = systemWebhookService.enqueueSystemWebhook.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('userCreated');
			expect((calls[2] as any).id).toBe('dummy-user-1');
		});
	});
});
