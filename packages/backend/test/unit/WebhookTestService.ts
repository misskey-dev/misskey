/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { beforeAll, describe, jest } from '@jest/globals';
import { WebhookTestService } from '@/core/WebhookTestService.js';
import { UserWebhookPayload, UserWebhookService } from '@/core/UserWebhookService.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { MiSystemWebhook, MiUser, MiWebhook, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { QueueService } from '@/core/QueueService.js';

describe('WebhookTestService', () => {
	let app: TestingModule;
	let service: WebhookTestService;

	// --------------------------------------------------------------------------------------

	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let queueService: jest.Mocked<QueueService>;
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
					provide: QueueService, useFactory: () => ({
						systemWebhookDeliver: jest.fn(),
						userWebhookDeliver: jest.fn(),
					}),
				},
				{
					provide: UserWebhookService, useFactory: () => ({
						fetchWebhooks: jest.fn(),
					}),
				},
				{
					provide: SystemWebhookService, useFactory: () => ({
						fetchSystemWebhooks: jest.fn(),
					}),
				},
			],
		}).compile();

		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);

		service = app.get(WebhookTestService);
		idService = app.get(IdService);
		queueService = app.get(QueueService) as jest.Mocked<QueueService>;
		userWebhookService = app.get(UserWebhookService) as jest.Mocked<UserWebhookService>;
		systemWebhookService = app.get(SystemWebhookService) as jest.Mocked<SystemWebhookService>;

		app.enableShutdownHooks();
	});

	beforeEach(async () => {
		root = await createUser({ username: 'root', usernameLower: 'root', isRoot: true });
		alice = await createUser({ username: 'alice', usernameLower: 'alice', isRoot: false });

		userWebhookService.fetchWebhooks.mockReturnValue(Promise.resolve([
			{ id: 'dummy-webhook', active: true, userId: alice.id } as MiWebhook,
		]));
		systemWebhookService.fetchSystemWebhooks.mockReturnValue(Promise.resolve([
			{ id: 'dummy-webhook', isActive: true } as MiSystemWebhook,
		]));
	});

	afterEach(async () => {
		queueService.systemWebhookDeliver.mockClear();
		queueService.userWebhookDeliver.mockClear();
		userWebhookService.fetchWebhooks.mockClear();
		systemWebhookService.fetchSystemWebhooks.mockClear();

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

			const calls = queueService.userWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('note');
			expect((calls[2] as UserWebhookPayload<'note'>).note.id).toBe('dummy-note-1');
		});

		test('reply', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'reply' }, alice);

			const calls = queueService.userWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('reply');
			expect((calls[2] as UserWebhookPayload<'reply'>).note.id).toBe('dummy-reply-1');
		});

		test('renote', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'renote' }, alice);

			const calls = queueService.userWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('renote');
			expect((calls[2] as UserWebhookPayload<'renote'>).note.id).toBe('dummy-renote-1');
		});

		test('mention', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'mention' }, alice);

			const calls = queueService.userWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('mention');
			expect((calls[2] as UserWebhookPayload<'mention'>).note.id).toBe('dummy-mention-1');
		});

		test('follow', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'follow' }, alice);

			const calls = queueService.userWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('follow');
			expect((calls[2] as UserWebhookPayload<'follow'>).user.id).toBe('dummy-user-1');
		});

		test('followed', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'followed' }, alice);

			const calls = queueService.userWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('followed');
			expect((calls[2] as UserWebhookPayload<'followed'>).user.id).toBe('dummy-user-2');
		});

		test('unfollow', async () => {
			await service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'unfollow' }, alice);

			const calls = queueService.userWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('unfollow');
			expect((calls[2] as UserWebhookPayload<'unfollow'>).user.id).toBe('dummy-user-3');
		});

		describe('NoSuchWebhookError', () => {
			test('user not match', async () => {
				userWebhookService.fetchWebhooks.mockClear();
				userWebhookService.fetchWebhooks.mockReturnValue(Promise.resolve([
					{ id: 'dummy-webhook', active: true } as MiWebhook,
				]));

				await expect(service.testUserWebhook({ webhookId: 'dummy-webhook', type: 'note' }, root))
					.rejects.toThrow(WebhookTestService.NoSuchWebhookError);
			});
		});
	});

	describe('testSystemWebhook', () => {
		test('abuseReport', async () => {
			await service.testSystemWebhook({ webhookId: 'dummy-webhook', type: 'abuseReport' });

			const calls = queueService.systemWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('abuseReport');
			expect((calls[2] as any).id).toBe('dummy-abuse-report1');
			expect((calls[2] as any).resolved).toBe(false);
		});

		test('abuseReportResolved', async () => {
			await service.testSystemWebhook({ webhookId: 'dummy-webhook', type: 'abuseReportResolved' });

			const calls = queueService.systemWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('abuseReportResolved');
			expect((calls[2] as any).id).toBe('dummy-abuse-report1');
			expect((calls[2] as any).resolved).toBe(true);
		});

		test('userCreated', async () => {
			await service.testSystemWebhook({ webhookId: 'dummy-webhook', type: 'userCreated' });

			const calls = queueService.systemWebhookDeliver.mock.calls[0];
			expect((calls[0] as any).id).toBe('dummy-webhook');
			expect(calls[1]).toBe('userCreated');
			expect((calls[2] as any).id).toBe('dummy-user-1');
		});
	});
});
