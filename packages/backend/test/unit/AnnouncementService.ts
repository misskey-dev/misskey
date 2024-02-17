/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { AnnouncementService } from '@/core/AnnouncementService.js';
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
import { secureRndstr } from '@/misc/secure-rndstr.js';
import type { TestingModule } from '@nestjs/testing';
import type { MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('AnnouncementService', () => {
	let app: TestingModule;
	let announcementService: AnnouncementService;
	let usersRepository: UsersRepository;
	let announcementsRepository: AnnouncementsRepository;
	let announcementReadsRepository: AnnouncementReadsRepository;
	let globalEventService: jest.Mocked<GlobalEventService>;
	let moderationLogService: jest.Mocked<ModerationLogService>;

	function createUser(data: Partial<MiUser> = {}) {
		const un = secureRndstr(16);
		return usersRepository.insert({
			id: genAidx(Date.now()),
			username: un,
			usernameLower: un,
			...data,
		})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));
	}

	function createAnnouncement(data: Partial<MiAnnouncement & { createdAt: Date }> = {}) {
		return announcementsRepository.insert({
			id: genAidx(data.createdAt ?? new Date()),
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
				CacheService,
				IdService,
			],
		})
			.useMocker((token) => {
				if (token === GlobalEventService) {
					return {
						publishMainStream: jest.fn(),
						publishBroadcastStream: jest.fn(),
					};
				} else if (token === ModerationLogService) {
					return {
						log: jest.fn(),
					};
				} else if (typeof token === 'function') {
					const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
					const Mock = moduleMocker.generateFromMetadata(mockMetadata);
					return new Mock();
				}
			})
			.compile();

		app.enableShutdownHooks();

		announcementService = app.get<AnnouncementService>(AnnouncementService);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		announcementsRepository = app.get<AnnouncementsRepository>(DI.announcementsRepository);
		announcementReadsRepository = app.get<AnnouncementReadsRepository>(DI.announcementReadsRepository);
		globalEventService = app.get<GlobalEventService>(GlobalEventService) as jest.Mocked<GlobalEventService>;
		moderationLogService = app.get<ModerationLogService>(ModerationLogService) as jest.Mocked<ModerationLogService>;
	});

	afterEach(async () => {
		await Promise.all([
			app.get(DI.metasRepository).delete({}),
			usersRepository.delete({}),
			announcementsRepository.delete({}),
			announcementReadsRepository.delete({}),
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
	});

	describe('read', () => {
		// TODO
	});
});

