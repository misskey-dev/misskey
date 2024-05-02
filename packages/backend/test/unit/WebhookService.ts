/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from '@/core/WebhookService.js';
import { MiUser } from '@/models/User.js';
import { MiSystemWebhook, SystemWebhookEventType } from '@/models/SystemWebhook.js';
import { SystemWebhooksRepository, UsersRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { QueueService } from '@/core/QueueService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { randomString } from '../utils.js';

describe('WebhookService', () => {
	let app: TestingModule;
	let service: WebhookService;

	// --------------------------------------------------------------------------------------

	let usersRepository: UsersRepository;
	let systemWebhooksRepository: SystemWebhooksRepository;
	let idService: IdService;
	let globalEventService: GlobalEventService;
	let queueService: jest.Mocked<QueueService>;

	// --------------------------------------------------------------------------------------

	let root: MiUser;

	// --------------------------------------------------------------------------------------

	async function createUser(data: Partial<MiUser> = {}) {
		return await usersRepository
			.insert({
				id: idService.gen(),
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));
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

	// --------------------------------------------------------------------------------------

	async function beforeAllImpl() {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					WebhookService,
					IdService,
					LoggerService,
					GlobalEventService,
					{
						provide: QueueService, useFactory: () => ({ systemWebhookDeliver: jest.fn() }),
					},
					{
						provide: ModerationLogService, useFactory: () => ({ log: () => Promise.resolve() }),
					},
				],
			})
			.compile();

		usersRepository = app.get(DI.usersRepository);
		systemWebhooksRepository = app.get(DI.systemWebhooksRepository);

		service = app.get(WebhookService);
		idService = app.get(IdService);
		globalEventService = app.get(GlobalEventService);
		queueService = app.get(QueueService) as jest.Mocked<QueueService>;

		app.enableShutdownHooks();
	}

	async function afterAllImpl() {
		await app.close();
	}

	async function beforeEachImpl() {
		await usersRepository.delete({});
		await systemWebhooksRepository.delete({});
	}

	async function afterEachImpl() {
		await usersRepository.delete({});
		await systemWebhooksRepository.delete({});
	}

	// --------------------------------------------------------------------------------------

	describe('アプリを毎回作り直す必要のないグループ', () => {
		beforeAll(beforeAllImpl);
		afterAll(afterAllImpl);
		beforeEach(beforeEachImpl);
		afterEach(afterEachImpl);

		describe('fetchSystemWebhooks', () => {
			test('フィルタなし', async () => {
				const webhook1 = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});
				const webhook2 = await createWebhook({
					isActive: false,
					on: ['abuseReport'],
				});
				const webhook3 = await createWebhook({
					isActive: true,
					on: [],
				});
				const webhook4 = await createWebhook({
					isActive: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchSystemWebhooks();
				expect(fetchedWebhooks).toEqual([webhook1, webhook2, webhook3, webhook4]);
			});

			test('activeのみ', async () => {
				const webhook1 = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});
				const webhook2 = await createWebhook({
					isActive: false,
					on: ['abuseReport'],
				});
				const webhook3 = await createWebhook({
					isActive: true,
					on: [],
				});
				const webhook4 = await createWebhook({
					isActive: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchSystemWebhooks({ isActive: true });
				expect(fetchedWebhooks).toEqual([webhook1, webhook3]);
			});

			test('特定のイベントのみ', async () => {
				const webhook1 = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});
				const webhook2 = await createWebhook({
					isActive: false,
					on: ['abuseReport'],
				});
				const webhook3 = await createWebhook({
					isActive: true,
					on: [],
				});
				const webhook4 = await createWebhook({
					isActive: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchSystemWebhooks({ on: ['abuseReport'] });
				expect(fetchedWebhooks).toEqual([webhook1, webhook2]);
			});

			test('activeな特定のイベントのみ', async () => {
				const webhook1 = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});
				const webhook2 = await createWebhook({
					isActive: false,
					on: ['abuseReport'],
				});
				const webhook3 = await createWebhook({
					isActive: true,
					on: [],
				});
				const webhook4 = await createWebhook({
					isActive: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchSystemWebhooks({ on: ['abuseReport'], isActive: true });
				expect(fetchedWebhooks).toEqual([webhook1]);
			});

			test('ID指定', async () => {
				const webhook1 = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});
				const webhook2 = await createWebhook({
					isActive: false,
					on: ['abuseReport'],
				});
				const webhook3 = await createWebhook({
					isActive: true,
					on: [],
				});
				const webhook4 = await createWebhook({
					isActive: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchSystemWebhooks({ ids: [webhook1.id, webhook4.id] });
				expect(fetchedWebhooks).toEqual([webhook1, webhook4]);
			});

			test('ID指定(他条件とANDになるか見たい)', async () => {
				const webhook1 = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});
				const webhook2 = await createWebhook({
					isActive: false,
					on: ['abuseReport'],
				});
				const webhook3 = await createWebhook({
					isActive: true,
					on: [],
				});
				const webhook4 = await createWebhook({
					isActive: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchSystemWebhooks({ ids: [webhook1.id, webhook4.id], isActive: false });
				expect(fetchedWebhooks).toEqual([webhook4]);
			});
		});

		describe('createSystemWebhook', () => {
			test('作成成功	', async () => {
				const params = {
					isActive: true,
					name: randomString(),
					on: ['abuseReport'] as SystemWebhookEventType[],
					url: 'https://example.com',
					secret: randomString(),
				};

				const webhook = await service.createSystemWebhook(params, root);
				expect(webhook).toMatchObject(params);
			});
		});

		describe('updateSystemWebhook', () => {
			test('更新成功', async () => {
				const webhook = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});

				const params = {
					id: webhook.id,
					isActive: false,
					name: randomString(),
					on: ['abuseReport'] as SystemWebhookEventType[],
					url: randomString(),
					secret: randomString(),
				};

				const updatedWebhook = await service.updateSystemWebhook(params, root);
				expect(updatedWebhook).toMatchObject(params);
			});
		});

		describe('deleteSystemWebhook', () => {
			test('削除成功', async () => {
				const webhook = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});

				await service.deleteSystemWebhook(webhook.id, root);

				await expect(systemWebhooksRepository.findOneBy({ id: webhook.id })).resolves.toBeNull();
			});
		});
	});

	describe('アプリを毎回作り直す必要があるグループ', () => {
		describe('enqueueSystemWebhook', () => {
			beforeEach(async () => {
				await beforeAllImpl();
				await beforeEachImpl();
			});

			afterEach(async () => {
				await afterEachImpl();
				await afterAllImpl();
			});

			test('キューに追加成功', async () => {
				const webhook = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});
				await service.enqueueSystemWebhook(webhook.id, 'abuseReport', { foo: 'bar' });

				expect(queueService.systemWebhookDeliver).toHaveBeenCalled();
			});

			test('非アクティブなWebhookはキューに追加されない', async () => {
				const webhook = await createWebhook({
					isActive: false,
					on: ['abuseReport'],
				});
				await service.enqueueSystemWebhook(webhook.id, 'abuseReport', { foo: 'bar' });

				expect(queueService.systemWebhookDeliver).not.toHaveBeenCalled();
			});

			test('未許可のイベント種別が渡された場合はWebhookはキューに追加されない', async () => {
				const webhook = await createWebhook({
					isActive: true,
					on: [],
				});
				await service.enqueueSystemWebhook(webhook.id, 'abuseReport', { foo: 'bar' });

				expect(queueService.systemWebhookDeliver).not.toHaveBeenCalled();
			});
		});
	});
});
