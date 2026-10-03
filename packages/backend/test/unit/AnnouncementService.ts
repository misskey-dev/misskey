/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { describe, expect, beforeEach, afterEach, test, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { Test } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';
import { AnnouncementEntityService } from '@/core/entities/AnnouncementEntityService.js';
import type {
	AnnouncementReadsRepository,
	AnnouncementsRepository,
	MiAnnouncement,
	MiUser,
	UsersRepository,
} from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { genAidx } from '@/misc/id/aidx.js';
import { CacheService } from '@/core/CacheService.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueueService } from '@/core/QueueService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import type { TestingModule } from '@nestjs/testing';

describe('AnnouncementService', () => {
	let app: TestingModule;
	let announcementService: AnnouncementService;
	let usersRepository: UsersRepository;
	let announcementsRepository: AnnouncementsRepository;
	let announcementReadsRepository: AnnouncementReadsRepository;
	let globalEventService: Mocked<GlobalEventService>;
	let moderationLogService: Mocked<ModerationLogService>;
	let queueService: Mocked<QueueService>;

	function createUser(data: Partial<MiUser> = {}) {
		const un = secureRndstr(16);
		return usersRepository.insert({
			id: genAidx(Date.now()),
			username: un,
			usernameLower: un.toLowerCase(),
			...data,
		})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));
	}

	function createAnnouncement(data: Partial<MiAnnouncement & { createdAt: Date }> = {}) {
		return announcementsRepository.insert({
			id: genAidx(data.createdAt?.getTime() ?? Date.now()),
			updatedAt: null,
			title: 'Title',
			text: 'Text',
			...data,
		})
			.then(x => announcementsRepository.findOneByOrFail(x.identifiers[0]));
	}

	beforeEach(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				AnnouncementService,
				AnnouncementEntityService,
				CacheService,
				IdService,
			],
		})
			.useMocker((token) => {
				if (token === GlobalEventService) {
					return {
						publishMainStream: vi.fn(),
						publishBroadcastStream: vi.fn(),
					};
				} else if (token === ModerationLogService) {
					return {
						log: vi.fn(),
					};
				} else if (typeof token === 'function') {
					return mockDeep<typeof token>();
				}
			})
			.compile();

		app.enableShutdownHooks();

		announcementService = app.get<AnnouncementService>(AnnouncementService);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		announcementsRepository = app.get<AnnouncementsRepository>(DI.announcementsRepository);
		announcementReadsRepository = app.get<AnnouncementReadsRepository>(DI.announcementReadsRepository);
		globalEventService = app.get<GlobalEventService>(GlobalEventService) as Mocked<GlobalEventService>;
		moderationLogService = app.get<ModerationLogService>(ModerationLogService) as Mocked<ModerationLogService>;
		queueService = app.get<QueueService>(QueueService) as Mocked<QueueService>;
	});

	afterEach(async () => {
		await Promise.all([
			app.get(DI.metasRepository).createQueryBuilder().delete().execute(),
			usersRepository.createQueryBuilder().delete().execute(),
			announcementsRepository.createQueryBuilder().delete().execute(),
			announcementReadsRepository.createQueryBuilder().delete().execute(),
		]);

		await app.close();
	});

	describe('getUnreadAnnouncements', () => {
		test('通常', async () => {
			const user = await createUser();
			const announcement = await createAnnouncement({
				title: '1',
			});

			const result = await announcementService.getUnreadAnnouncements(user);

			expect(result.length).toBe(1);
			expect(result[0].title).toBe(announcement.title);
		});

		test('isActiveがfalseは除外', async () => {
			const user = await createUser();
			await createAnnouncement({
				isActive: false,
			});

			const result = await announcementService.getUnreadAnnouncements(user);

			expect(result.length).toBe(0);
		});

		test('自動アーカイブ日時を過ぎたお知らせは除外', async () => {
			const user = await createUser();
			await Promise.all([
				createAnnouncement({
					title: 'expired',
					autoArchiveAt: new Date(Date.now() - 1000),
				}),
				createAnnouncement({
					title: 'scheduled',
					autoArchiveAt: new Date(Date.now() + 1000),
				}),
			]);

			const result = await announcementService.getUnreadAnnouncements(user);

			expect(result.map(announcement => announcement.title)).toEqual(['scheduled']);
		});

		test('forExistingUsers', async () => {
			const user = await createUser();
			const [announcementAfter, announcementBefore, announcementBefore2] = await Promise.all([
				createAnnouncement({
					title: 'after',
					createdAt: new Date(),
					forExistingUsers: true,
				}),
				createAnnouncement({
					title: 'before',
					createdAt: new Date(Date.now() - 1000),
					forExistingUsers: true,
				}),
				createAnnouncement({
					title: 'before2',
					createdAt: new Date(Date.now() - 1000),
					forExistingUsers: false,
				}),
			]);

			const result = await announcementService.getUnreadAnnouncements(user);

			expect(result.length).toBe(2);
			expect(result.some(a => a.title === announcementAfter.title)).toBe(true);
			expect(result.some(a => a.title === announcementBefore.title)).toBe(false);
			expect(result.some(a => a.title === announcementBefore2.title)).toBe(true);
		});
	});

	describe('create', () => {
		test('通常', async () => {
			const me = await createUser();
			const result = await announcementService.create({
				title: 'Title',
				text: 'Text',
			}, me);

			expect(result.raw.title).toBe('Title');
			expect(result.packed.title).toBe('Title');

			expect(globalEventService.publishBroadcastStream).toHaveBeenCalled();
			expect(globalEventService.publishBroadcastStream.mock.lastCall![0]).toBe('announcementCreated');
			expect((globalEventService.publishBroadcastStream.mock.lastCall![1] as any).announcement).toBe(result.packed);
			expect(moderationLogService.log).toHaveBeenCalled();
		});

		test('ユーザー指定', async () => {
			const me = await createUser();
			const user = await createUser();
			const result = await announcementService.create({
				title: 'Title',
				text: 'Text',
				userId: user.id,
			}, me);

			expect(result.raw.title).toBe('Title');
			expect(result.packed.title).toBe('Title');

			expect(globalEventService.publishBroadcastStream).not.toHaveBeenCalled();
			expect(globalEventService.publishMainStream).toHaveBeenCalled();
			expect(globalEventService.publishMainStream.mock.lastCall![0]).toBe(user.id);
			expect(globalEventService.publishMainStream.mock.lastCall![1]).toBe('announcementCreated');
			expect((globalEventService.publishMainStream.mock.lastCall![2] as any).announcement).toBe(result.packed);
			expect(moderationLogService.log).toHaveBeenCalled();
		});

		test('過去の自動アーカイブ日時を指定するとアーカイブ済みで作成される', async () => {
			const me = await createUser();
			const result = await announcementService.create({
				title: 'Title',
				text: 'Text',
				autoArchiveAt: new Date(Date.now() - 1000),
			}, me);

			expect(result.raw.isActive).toBe(false);
			expect(globalEventService.publishBroadcastStream).not.toHaveBeenCalled();
			expect(queueService.scheduleAnnouncementArchive).not.toHaveBeenCalled();
		});

		test('自動アーカイブ日時を指定するとアーカイブジョブを予約する', async () => {
			const autoArchiveAt = new Date(Date.now() + 60_000);
			const result = await announcementService.create({
				title: 'Title',
				text: 'Text',
				autoArchiveAt,
			});

			expect(queueService.scheduleAnnouncementArchive).toHaveBeenCalledWith(result.raw.id, autoArchiveAt);
		});
	});

	describe('update', () => {
		test('自動アーカイブ日時を変更するとジョブを予約し直す', async () => {
			const autoArchiveAt = new Date(Date.now() + 60_000);
			const updatedAutoArchiveAt = new Date(Date.now() + 120_000);
			const announcement = await createAnnouncement({ autoArchiveAt });

			await announcementService.update(announcement, { autoArchiveAt: updatedAutoArchiveAt });

			expect(queueService.clearAnnouncementArchive).toHaveBeenCalledWith(announcement.id, autoArchiveAt);
			expect(queueService.scheduleAnnouncementArchive).toHaveBeenCalledWith(announcement.id, updatedAutoArchiveAt);
		});
	});

	describe('onModuleInit', () => {
		test('既存のアクティブなお知らせのアーカイブジョブを予約する', async () => {
			const autoArchiveAt = new Date(Date.now() + 60_000);
			const [active] = await Promise.all([
				createAnnouncement({ autoArchiveAt }),
				createAnnouncement({ isActive: false, autoArchiveAt }),
			]);

			await announcementService.onModuleInit();

			expect(queueService.scheduleAnnouncementArchive).toHaveBeenCalledOnce();
			expect(queueService.scheduleAnnouncementArchive).toHaveBeenCalledWith(active.id, autoArchiveAt);
		});
	});

	describe('archiveAnnouncement', () => {
		test('ジョブと期限が一致する期限切れのお知らせだけをアーカイブする', async () => {
			const autoArchiveAt = new Date(Date.now() - 1000);
			const announcement = await createAnnouncement({ autoArchiveAt });

			expect(await announcementService.archiveAnnouncement(announcement.id, new Date(autoArchiveAt.getTime() - 1000))).toBe(false);
			expect((await announcementsRepository.findOneByOrFail({ id: announcement.id })).isActive).toBe(true);

			expect(await announcementService.archiveAnnouncement(announcement.id, autoArchiveAt)).toBe(true);
			expect((await announcementsRepository.findOneByOrFail({ id: announcement.id })).isActive).toBe(false);
			expect(await announcementService.archiveAnnouncement(announcement.id, autoArchiveAt)).toBe(false);
		});

		test('期限前にはアーカイブしない', async () => {
			const autoArchiveAt = new Date(Date.now() + 60_000);
			const announcement = await createAnnouncement({ autoArchiveAt });

			expect(await announcementService.archiveAnnouncement(announcement.id, autoArchiveAt)).toBe(false);
			expect((await announcementsRepository.findOneByOrFail({ id: announcement.id })).isActive).toBe(true);
		});
	});

	describe('delete', () => {
		test('自動アーカイブジョブを削除する', async () => {
			const autoArchiveAt = new Date(Date.now() + 60_000);
			const announcement = await createAnnouncement({ autoArchiveAt });

			await announcementService.delete(announcement);

			expect(queueService.clearAnnouncementArchive).toHaveBeenCalledWith(announcement.id, autoArchiveAt);
		});
	});

	describe.todo('read', () => {
		// TODO
	});
});
