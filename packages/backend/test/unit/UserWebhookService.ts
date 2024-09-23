
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, beforeEach, describe, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { randomString } from '../utils.js';
import { MiUser } from '@/models/User.js';
import { MiWebhook, UsersRepository, WebhooksRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { QueueService } from '@/core/QueueService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { UserWebhookService } from '@/core/UserWebhookService.js';

describe('UserWebhookService', () => {
	let app: TestingModule;
	let service: UserWebhookService;

	// --------------------------------------------------------------------------------------

	let usersRepository: UsersRepository;
	let userWebhooksRepository: WebhooksRepository;
	let idService: IdService;
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

	async function createWebhook(data: Partial<MiWebhook> = {}) {
		return userWebhooksRepository
			.insert({
				id: idService.gen(),
				name: randomString(),
				on: ['mention'],
				url: 'https://example.com',
				secret: randomString(),
				userId: root.id,
				...data,
			})
			.then(x => userWebhooksRepository.findOneByOrFail(x.identifiers[0]));
	}

	// --------------------------------------------------------------------------------------

	async function beforeAllImpl() {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					UserWebhookService,
					IdService,
					LoggerService,
					GlobalEventService,
					{
						provide: QueueService, useFactory: () => ({ systemWebhookDeliver: jest.fn() }),
					},
				],
			})
			.compile();

		usersRepository = app.get(DI.usersRepository);
		userWebhooksRepository = app.get(DI.webhooksRepository);

		service = app.get(UserWebhookService);
		idService = app.get(IdService);
		queueService = app.get(QueueService) as jest.Mocked<QueueService>;

		app.enableShutdownHooks();
	}

	async function afterAllImpl() {
		await app.close();
	}

	async function beforeEachImpl() {
		root = await createUser({ isRoot: true, username: 'root', usernameLower: 'root' });
	}

	async function afterEachImpl() {
		await usersRepository.delete({});
		await userWebhooksRepository.delete({});
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
					active: true,
					on: ['mention'],
				});
				const webhook2 = await createWebhook({
					active: false,
					on: ['mention'],
				});
				const webhook3 = await createWebhook({
					active: true,
					on: ['reply'],
				});
				const webhook4 = await createWebhook({
					active: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchWebhooks();
				expect(fetchedWebhooks).toEqual([webhook1, webhook2, webhook3, webhook4]);
			});

			test('activeのみ', async () => {
				const webhook1 = await createWebhook({
					active: true,
					on: ['mention'],
				});
				const webhook2 = await createWebhook({
					active: false,
					on: ['mention'],
				});
				const webhook3 = await createWebhook({
					active: true,
					on: ['reply'],
				});
				const webhook4 = await createWebhook({
					active: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchWebhooks({ isActive: true });
				expect(fetchedWebhooks).toEqual([webhook1, webhook3]);
			});

			test('特定のイベントのみ', async () => {
				const webhook1 = await createWebhook({
					active: true,
					on: ['mention'],
				});
				const webhook2 = await createWebhook({
					active: false,
					on: ['mention'],
				});
				const webhook3 = await createWebhook({
					active: true,
					on: ['reply'],
				});
				const webhook4 = await createWebhook({
					active: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchWebhooks({ on: ['mention'] });
				expect(fetchedWebhooks).toEqual([webhook1, webhook2]);
			});

			test('activeな特定のイベントのみ', async () => {
				const webhook1 = await createWebhook({
					active: true,
					on: ['mention'],
				});
				const webhook2 = await createWebhook({
					active: false,
					on: ['mention'],
				});
				const webhook3 = await createWebhook({
					active: true,
					on: ['reply'],
				});
				const webhook4 = await createWebhook({
					active: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchWebhooks({ on: ['mention'], isActive: true });
				expect(fetchedWebhooks).toEqual([webhook1]);
			});

			test('ID指定', async () => {
				const webhook1 = await createWebhook({
					active: true,
					on: ['mention'],
				});
				const webhook2 = await createWebhook({
					active: false,
					on: ['mention'],
				});
				const webhook3 = await createWebhook({
					active: true,
					on: ['reply'],
				});
				const webhook4 = await createWebhook({
					active: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchWebhooks({ ids: [webhook1.id, webhook4.id] });
				expect(fetchedWebhooks).toEqual([webhook1, webhook4]);
			});

			test('ID指定(他条件とANDになるか見たい)', async () => {
				const webhook1 = await createWebhook({
					active: true,
					on: ['mention'],
				});
				const webhook2 = await createWebhook({
					active: false,
					on: ['mention'],
				});
				const webhook3 = await createWebhook({
					active: true,
					on: ['reply'],
				});
				const webhook4 = await createWebhook({
					active: false,
					on: [],
				});

				const fetchedWebhooks = await service.fetchWebhooks({ ids: [webhook1.id, webhook4.id], isActive: false });
				expect(fetchedWebhooks).toEqual([webhook4]);
			});
		});
	});
});
