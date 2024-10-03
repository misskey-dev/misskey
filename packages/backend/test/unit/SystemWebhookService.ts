/* eslint-disable @typescript-eslint/no-explicit-any */
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { setTimeout } from 'node:timers/promises';
import { afterEach, beforeEach, describe, expect, jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { randomString } from '../utils.js';
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
import { SystemWebhookService } from '@/core/SystemWebhookService.js';

describe('SystemWebhookService', () => {
	let app: TestingModule;
	let service: SystemWebhookService;

	// --------------------------------------------------------------------------------------

	let usersRepository: UsersRepository;
	let systemWebhooksRepository: SystemWebhooksRepository;
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
					SystemWebhookService,
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

		service = app.get(SystemWebhookService);
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
					on: ['abuseReportResolved'],
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
					on: ['abuseReportResolved'],
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
					on: ['abuseReportResolved'],
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
					on: ['abuseReportResolved'],
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
					on: ['abuseReportResolved'],
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
					on: ['abuseReportResolved'],
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
		beforeEach(async () => {
			await beforeAllImpl();
			await beforeEachImpl();
		});

		afterEach(async () => {
			await afterEachImpl();
			await afterAllImpl();
		});

		describe('enqueueSystemWebhook', () => {
			test('キューに追加成功', async () => {
				const webhook = await createWebhook({
					isActive: true,
					on: ['abuseReport'],
				});
				await service.enqueueSystemWebhook(webhook.id, 'abuseReport', { foo: 'bar' } as any);

				expect(queueService.systemWebhookDeliver).toHaveBeenCalled();
			});

			test('非アクティブなWebhookはキューに追加されない', async () => {
				const webhook = await createWebhook({
					isActive: false,
					on: ['abuseReport'],
				});
				await service.enqueueSystemWebhook(webhook.id, 'abuseReport', { foo: 'bar' } as any);

				expect(queueService.systemWebhookDeliver).not.toHaveBeenCalled();
			});

			test('未許可のイベント種別が渡された場合はWebhookはキューに追加されない', async () => {
				const webhook1 = await createWebhook({
					isActive: true,
					on: [],
				});
				const webhook2 = await createWebhook({
					isActive: true,
					on: ['abuseReportResolved'],
				});
				await service.enqueueSystemWebhook(webhook1.id, 'abuseReport', { foo: 'bar' } as any);
				await service.enqueueSystemWebhook(webhook2.id, 'abuseReport', { foo: 'bar' } as any);

				expect(queueService.systemWebhookDeliver).not.toHaveBeenCalled();
			});
		});

		describe('fetchActiveSystemWebhooks', () => {
			describe('systemWebhookCreated', () => {
				test('ActiveなWebhookが追加された時、キャッシュに追加されている', async () => {
					const webhook = await service.createSystemWebhook(
						{
							isActive: true,
							name: randomString(),
							on: ['abuseReport'],
							url: 'https://example.com',
							secret: randomString(),
						},
						root,
					);

					// redisでの配信経由で更新されるのでちょっと待つ
					await setTimeout(500);

					const fetchedWebhooks = await service.fetchActiveSystemWebhooks();
					expect(fetchedWebhooks).toEqual([webhook]);
				});

				test('NotActiveなWebhookが追加された時、キャッシュに追加されていない', async () => {
					const webhook = await service.createSystemWebhook(
						{
							isActive: false,
							name: randomString(),
							on: ['abuseReport'],
							url: 'https://example.com',
							secret: randomString(),
						},
						root,
					);

					// redisでの配信経由で更新されるのでちょっと待つ
					await setTimeout(500);

					const fetchedWebhooks = await service.fetchActiveSystemWebhooks();
					expect(fetchedWebhooks).toEqual([]);
				});
			});

			describe('systemWebhookUpdated', () => {
				test('ActiveなWebhookが編集された時、キャッシュに反映されている', async () => {
					const id = idService.gen();
					await createWebhook({ id });
					// キャッシュ作成
					const webhook1 = await service.fetchActiveSystemWebhooks();
					// 読み込まれていることをチェック
					expect(webhook1.length).toEqual(1);
					expect(webhook1[0].id).toEqual(id);

					const webhook2 = await service.updateSystemWebhook(
						{
							id,
							isActive: true,
							name: randomString(),
							on: ['abuseReport'],
							url: 'https://example.com',
							secret: randomString(),
						},
						root,
					);

					// redisでの配信経由で更新されるのでちょっと待つ
					await setTimeout(500);

					const fetchedWebhooks = await service.fetchActiveSystemWebhooks();
					expect(fetchedWebhooks).toEqual([webhook2]);
				});

				test('NotActiveなWebhookが編集された時、キャッシュに追加されない', async () => {
					const id = idService.gen();
					await createWebhook({ id, isActive: false });
					// キャッシュ作成
					const webhook1 = await service.fetchActiveSystemWebhooks();
					// 読み込まれていないことをチェック
					expect(webhook1.length).toEqual(0);

					const webhook2 = await service.updateSystemWebhook(
						{
							id,
							isActive: false,
							name: randomString(),
							on: ['abuseReport'],
							url: 'https://example.com',
							secret: randomString(),
						},
						root,
					);

					// redisでの配信経由で更新されるのでちょっと待つ
					await setTimeout(500);

					const fetchedWebhooks = await service.fetchActiveSystemWebhooks();
					expect(fetchedWebhooks.length).toEqual(0);
				});

				test('NotActiveなWebhookがActiveにされた時、キャッシュに追加されている', async () => {
					const id = idService.gen();
					const baseWebhook = await createWebhook({ id, isActive: false });
					// キャッシュ作成
					const webhook1 = await service.fetchActiveSystemWebhooks();
					// 読み込まれていないことをチェック
					expect(webhook1.length).toEqual(0);

					const webhook2 = await service.updateSystemWebhook(
						{
							...baseWebhook,
							isActive: true,
						},
						root,
					);

					// redisでの配信経由で更新されるのでちょっと待つ
					await setTimeout(500);

					const fetchedWebhooks = await service.fetchActiveSystemWebhooks();
					expect(fetchedWebhooks).toEqual([webhook2]);
				});

				test('ActiveなWebhookがNotActiveにされた時、キャッシュから削除されている', async () => {
					const id = idService.gen();
					const baseWebhook = await createWebhook({ id, isActive: true });
					// キャッシュ作成
					const webhook1 = await service.fetchActiveSystemWebhooks();
					// 読み込まれていることをチェック
					expect(webhook1.length).toEqual(1);
					expect(webhook1[0].id).toEqual(id);

					const webhook2 = await service.updateSystemWebhook(
						{
							...baseWebhook,
							isActive: false,
						},
						root,
					);

					// redisでの配信経由で更新されるのでちょっと待つ
					await setTimeout(500);

					const fetchedWebhooks = await service.fetchActiveSystemWebhooks();
					expect(fetchedWebhooks.length).toEqual(0);
				});
			});

			describe('systemWebhookDeleted', () => {
				test('キャッシュから削除されている', async () => {
					const id = idService.gen();
					const baseWebhook = await createWebhook({ id, isActive: true });
					// キャッシュ作成
					const webhook1 = await service.fetchActiveSystemWebhooks();
					// 読み込まれていることをチェック
					expect(webhook1.length).toEqual(1);
					expect(webhook1[0].id).toEqual(id);

					const webhook2 = await service.deleteSystemWebhook(
						id,
						root,
					);

					// redisでの配信経由で更新されるのでちょっと待つ
					await setTimeout(500);

					const fetchedWebhooks = await service.fetchActiveSystemWebhooks();
					expect(fetchedWebhooks.length).toEqual(0);
				});
			});
		});
	});
});
