/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import * as Redis from 'ioredis';
import { GlobalModule } from '@/GlobalModule.js';
import type { UsersRepository, MiUser, NotesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { genAidx } from '@/misc/id/aidx.js';
import { CacheService } from '@/core/CacheService.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { NoteCreateService } from '@/core/NoteCreateService.js';
import { CoreModule } from '@/core/CoreModule.js';
import { MetaService } from '@/core/MetaService.js';
import { RoleService } from '@/core/RoleService.js';
import NotesChart from '@/core/chart/charts/notes.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { HashtagService } from '@/core/HashtagService.js';
import { AntennaService } from '@/core/AntennaService.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { ApPersonService } from '@/core/activitypub/models/ApPersonService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { sleep } from '../utils.js';
import type { TestingModule } from '@nestjs/testing';
import type { MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('NoteCreateService', () => {
	let app: TestingModule;
	let noteCreateService: NoteCreateService;
	let usersRepository: UsersRepository;
	let notesRepository: NotesRepository;
	let globalEventService: jest.Mocked<GlobalEventService>;
	let redisForTimelines: jest.Mocked<Redis.Redis>;

	function createUser(data: Partial<MiUser> = {}) {
		const un = secureRndstr(16);
		return usersRepository.insert({
			id: genAidx(new Date()),
			createdAt: new Date(),
			username: un,
			usernameLower: un,
			...data,
		})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));
	}

	beforeEach(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
				//CoreModule,
			],
			providers: [
				UtilityService,
				MetaService,
				CacheService,
				IdService,
				RoleService,
				NotesChart,
				PerUserNotesChart,
				ActiveUsersChart,
				UserEntityService,
				NoteEntityService,
				HashtagService,
				AntennaService,
				NoteCreateService,
			],
		})
			.useMocker((token) => {
				if (token === GlobalEventService) {
					return {
						publishNotesStream: jest.fn(),
						publishMainStream: jest.fn(),
					};
				} else if (token === DI.redisForTimelines) {
					return {
						xadd: jest.fn(),
					};
				} else if (typeof token === 'function') {
					const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
					const Mock = moduleMocker.generateFromMetadata(mockMetadata);
					return new Mock();
				}
			})
			.compile();

		await app.init();
		app.enableShutdownHooks();

		noteCreateService = app.get<NoteCreateService>(NoteCreateService);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		globalEventService = app.get<GlobalEventService>(GlobalEventService) as jest.Mocked<GlobalEventService>;
		redisForTimelines = app.get<Redis.Redis>(DI.redisForTimelines) as jest.Mocked<Redis.Redis>;
	});

	afterEach(async () => {
		await Promise.all([
			app.get(DI.metasRepository).delete({}),
			usersRepository.delete({}),
			notesRepository.delete({}),
		]);

		await app.close();
	});

	describe('create', () => {
		test('text', async () => {
			const me = await createUser();
			const follower = await createUser();
			await app.get(DI.followingsRepository).insert({
				id: genAidx(new Date()),
				followerId: follower.id,
				followeeId: me.id,
				createdAt: new Date(),
			});
			const result = await noteCreateService.create(me, {
				text: 'Hello, Misskey!',
			});

			expect(result.text).toBe('Hello, Misskey!');

			await sleep(100);

			expect(globalEventService.publishNotesStream).toHaveBeenCalled();
			expect(globalEventService.publishNotesStream.mock.lastCall![0].id).toBe(result.id);
			expect(redisForTimelines.xadd).toHaveBeenCalled();
			expect(redisForTimelines.xadd.mock.calls.some(call => call[0] === `homeTimeline:${follower.id}`)).toBe(true);
		});
	});
});

