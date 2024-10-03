/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { AbuseReportNotificationService } from '@/core/AbuseReportNotificationService.js';
import {
	AbuseReportNotificationRecipientRepository,
	MiAbuseReportNotificationRecipient,
	MiSystemWebhook,
	MiUser,
	SystemWebhooksRepository,
	UserProfilesRepository,
	UsersRepository,
} from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { GlobalModule } from '@/GlobalModule.js';
import { IdService } from '@/core/IdService.js';
import { EmailService } from '@/core/EmailService.js';
import { RoleService } from '@/core/RoleService.js';
import { MetaService } from '@/core/MetaService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { RecipientMethod } from '@/models/AbuseReportNotificationRecipient.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';
import { randomString } from '../utils.js';

process.env.NODE_ENV = 'test';

describe('AbuseReportNotificationService', () => {
	let app: TestingModule;
	let service: AbuseReportNotificationService;

	// --------------------------------------------------------------------------------------

	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let systemWebhooksRepository: SystemWebhooksRepository;
	let abuseReportNotificationRecipientRepository: AbuseReportNotificationRecipientRepository;
	let idService: IdService;
	let roleService: jest.Mocked<RoleService>;
	let emailService: jest.Mocked<EmailService>;
	let webhookService: jest.Mocked<SystemWebhookService>;

	// --------------------------------------------------------------------------------------

	let root: MiUser;
	let alice: MiUser;
	let bob: MiUser;
	let systemWebhook1: MiSystemWebhook;
	let systemWebhook2: MiSystemWebhook;

	// --------------------------------------------------------------------------------------

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

	async function createWebhook(data: Partial<MiSystemWebhook> = {}) {
		return systemWebhooksRepository
			.insert({
				id: idService.gen(),
				name: randomString(),
				on: ['abuseReport'],
				url: 'https://example.com',
				secret: randomString(),
				...data,
			})
			.then(x => systemWebhooksRepository.findOneByOrFail(x.identifiers[0]));
	}

	async function createRecipient(data: Partial<MiAbuseReportNotificationRecipient> = {}) {
		return abuseReportNotificationRecipientRepository
			.insert({
				id: idService.gen(),
				isActive: true,
				name: randomString(),
				...data,
			})
			.then(x => abuseReportNotificationRecipientRepository.findOneByOrFail(x.identifiers[0]));
	}

	// --------------------------------------------------------------------------------------

	beforeAll(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					AbuseReportNotificationService,
					IdService,
					{
						provide: RoleService, useFactory: () => ({ getModeratorIds: jest.fn() }),
					},
					{
						provide: SystemWebhookService, useFactory: () => ({ enqueueSystemWebhook: jest.fn() }),
					},
					{
						provide: EmailService, useFactory: () => ({ sendEmail: jest.fn() }),
					},
					{
						provide: MetaService, useFactory: () => ({ fetch: jest.fn() }),
					},
					{
						provide: ModerationLogService, useFactory: () => ({ log: () => Promise.resolve() }),
					},
					{
						provide: GlobalEventService, useFactory: () => ({ publishAdminStream: jest.fn() }),
					},
				],
			})
			.compile();

		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);
		systemWebhooksRepository = app.get(DI.systemWebhooksRepository);
		abuseReportNotificationRecipientRepository = app.get(DI.abuseReportNotificationRecipientRepository);

		service = app.get(AbuseReportNotificationService);
		idService = app.get(IdService);
		roleService = app.get(RoleService) as jest.Mocked<RoleService>;
		emailService = app.get<EmailService>(EmailService) as jest.Mocked<EmailService>;
		webhookService = app.get<SystemWebhookService>(SystemWebhookService) as jest.Mocked<SystemWebhookService>;

		app.enableShutdownHooks();
	});

	beforeEach(async () => {
		root = await createUser({ username: 'root', usernameLower: 'root', isRoot: true });
		alice = await createUser({ username: 'alice', usernameLower: 'alice', isRoot: false });
		bob = await createUser({ username: 'bob', usernameLower: 'bob', isRoot: false });
		systemWebhook1 = await createWebhook();
		systemWebhook2 = await createWebhook();

		roleService.getModeratorIds.mockResolvedValue([root.id, alice.id, bob.id]);
	});

	afterEach(async () => {
		emailService.sendEmail.mockClear();
		webhookService.enqueueSystemWebhook.mockClear();

		await usersRepository.delete({});
		await userProfilesRepository.delete({});
		await systemWebhooksRepository.delete({});
		await abuseReportNotificationRecipientRepository.delete({});
	});

	afterAll(async () => {
		await app.close();
	});

	// --------------------------------------------------------------------------------------

	describe('createRecipient', () => {
		test('作成成功1', async () => {
			const params = {
				isActive: true,
				name: randomString(),
				method: 'email' as RecipientMethod,
				userId: alice.id,
				systemWebhookId: null,
			};

			const recipient1 = await service.createRecipient(params, root);
			expect(recipient1).toMatchObject(params);
		});

		test('作成成功2', async () => {
			const params = {
				isActive: true,
				name: randomString(),
				method: 'webhook' as RecipientMethod,
				userId: null,
				systemWebhookId: systemWebhook1.id,
			};

			const recipient1 = await service.createRecipient(params, root);
			expect(recipient1).toMatchObject(params);
		});
	});

	describe('updateRecipient', () => {
		test('更新成功1', async () => {
			const recipient1 = await createRecipient({
				method: 'email',
				userId: alice.id,
			});

			const params = {
				id: recipient1.id,
				isActive: false,
				name: randomString(),
				method: 'email' as RecipientMethod,
				userId: bob.id,
				systemWebhookId: null,
			};

			const recipient2 = await service.updateRecipient(params, root);
			expect(recipient2).toMatchObject(params);
		});

		test('更新成功2', async () => {
			const recipient1 = await createRecipient({
				method: 'webhook',
				systemWebhookId: systemWebhook1.id,
			});

			const params = {
				id: recipient1.id,
				isActive: false,
				name: randomString(),
				method: 'webhook' as RecipientMethod,
				userId: null,
				systemWebhookId: systemWebhook2.id,
			};

			const recipient2 = await service.updateRecipient(params, root);
			expect(recipient2).toMatchObject(params);
		});
	});

	describe('deleteRecipient', () => {
		test('削除成功1', async () => {
			const recipient1 = await createRecipient({
				method: 'email',
				userId: alice.id,
			});

			await service.deleteRecipient(recipient1.id, root);

			await expect(abuseReportNotificationRecipientRepository.findOneBy({ id: recipient1.id })).resolves.toBeNull();
		});
	});

	describe('fetchRecipients', () => {
		async function create() {
			const recipient1 = await createRecipient({
				method: 'email',
				userId: alice.id,
			});
			const recipient2 = await createRecipient({
				method: 'email',
				userId: bob.id,
			});

			const recipient3 = await createRecipient({
				method: 'webhook',
				systemWebhookId: systemWebhook1.id,
			});
			const recipient4 = await createRecipient({
				method: 'webhook',
				systemWebhookId: systemWebhook2.id,
			});

			return [recipient1, recipient2, recipient3, recipient4];
		}

		test('フィルタなし', async () => {
			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({});
			expect(recipients).toEqual([recipient1, recipient2, recipient3, recipient4]);
		});

		test('フィルタなし(非モデレータは除外される)', async () => {
			roleService.getModeratorIds.mockClear();
			roleService.getModeratorIds.mockResolvedValue([root.id, bob.id]);

			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({});
			// aliceはモデレータではないので除外される
			expect(recipients).toEqual([recipient2, recipient3, recipient4]);
		});

		test('フィルタなし(非モデレータでも除外されないオプション設定)', async () => {
			roleService.getModeratorIds.mockClear();
			roleService.getModeratorIds.mockResolvedValue([root.id, bob.id]);

			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({}, { removeUnauthorized: false });
			expect(recipients).toEqual([recipient1, recipient2, recipient3, recipient4]);
		});

		test('emailのみ', async () => {
			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({ method: ['email'] });
			expect(recipients).toEqual([recipient1, recipient2]);
		});

		test('webhookのみ', async () => {
			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({ method: ['webhook'] });
			expect(recipients).toEqual([recipient3, recipient4]);
		});

		test('すべて', async () => {
			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({ method: ['email', 'webhook'] });
			expect(recipients).toEqual([recipient1, recipient2, recipient3, recipient4]);
		});

		test('ID指定', async () => {
			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({ ids: [recipient1.id, recipient3.id] });
			expect(recipients).toEqual([recipient1, recipient3]);
		});

		test('ID指定(method=emailではないIDが混ざりこまない)', async () => {
			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({ ids: [recipient1.id, recipient3.id], method: ['email'] });
			expect(recipients).toEqual([recipient1]);
		});

		test('ID指定(method=webhookではないIDが混ざりこまない)', async () => {
			const [recipient1, recipient2, recipient3, recipient4] = await create();

			const recipients = await service.fetchRecipients({ ids: [recipient1.id, recipient3.id], method: ['webhook'] });
			expect(recipients).toEqual([recipient3]);
		});
	});
});
