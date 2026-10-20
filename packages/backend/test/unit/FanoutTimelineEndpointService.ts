/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, vi, test, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import type { Mocked } from 'vitest';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { FanoutTimelineEndpointService } from '@/core/FanoutTimelineEndpointService.js';
import { FanoutTimelineService, FanoutTimelineName } from '@/core/FanoutTimelineService.js';
import { IdService } from '@/core/IdService.js';
import { NotesRepository, UsersRepository, UserProfilesRepository, MiUser, MiNote } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

describe('FanoutTimelineEndpointService', () => {
	let app: TestingModule;
	let service: FanoutTimelineEndpointService;
	let fanoutTimelineService: Mocked<FanoutTimelineService>;
	let notesRepository: NotesRepository;
	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let idService: IdService;

	let alice: MiUser;

	async function createUser(data: Partial<MiUser> = {}) {
		const user = await usersRepository
			.insert({
				id: idService.gen(),
				username: 'username',
				usernameLower: 'username',
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.insert({
			userId: user.id,
		});

		return user;
	}

	async function createNote(data: Partial<MiNote> = {}) {
		return await notesRepository
			.insert({
				id: idService.gen(),
				userId: alice.id,
				text: 'test',
				visibility: 'public',
				localOnly: false,
				...data,
			})
			.then(x => notesRepository.findOneByOrFail(x.identifiers[0]));
	}

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
				CoreModule,
			],
			providers: [
				FanoutTimelineEndpointService,
			],
		})
			.overrideProvider(FanoutTimelineService)
			.useValue({
				getMulti: vi.fn(),
				injectDummy: vi.fn(),
				injectDummyIfEmpty: vi.fn(),
			})
			.compile();

		app.enableShutdownHooks();

		service = app.get<FanoutTimelineEndpointService>(FanoutTimelineEndpointService);
		fanoutTimelineService = app.get(FanoutTimelineService);
		notesRepository = app.get<NotesRepository>(DI.notesRepository);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		userProfilesRepository = app.get<UserProfilesRepository>(DI.userProfilesRepository);
		idService = app.get<IdService>(IdService);
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(async () => {
		alice = await createUser({ username: 'alice', usernameLower: 'alice' });
	});

	afterEach(async () => {
		vi.clearAllMocks();
		await notesRepository.deleteAll();
		await userProfilesRepository.deleteAll();
		await usersRepository.deleteAll();
	});

	test('should use correctly calculated threshold (Max of Oldest) when merging disjoint timelines', async () => {
		const now = Date.now();
		// HTL: Recent (T-2m to T-4m)
		const htlNote1 = await createNote({ id: idService.gen(now - 1000 * 60 * 2) });
		const htlNote2 = await createNote({ id: idService.gen(now - 1000 * 60 * 3) });
		const htlNote3 = await createNote({ id: idService.gen(now - 1000 * 60 * 4) }); // End of HTL (T-4m)

		const htlIds = [htlNote1.id, htlNote2.id, htlNote3.id];

		// LTL: Old (T-60m to T-62m)
		const ltlNote1 = await createNote({ id: idService.gen(now - 1000 * 60 * 60) });
		const ltlNote2 = await createNote({ id: idService.gen(now - 1000 * 60 * 61) });
		const ltlNote3 = await createNote({ id: idService.gen(now - 1000 * 60 * 62) });

		const ltlIds = [ltlNote1.id, ltlNote2.id, ltlNote3.id];

		// Mock FanoutTimelineService to return these IDs
		fanoutTimelineService.getMulti.mockResolvedValue([htlIds, ltlIds]);

		// dbFallback spy
		const dbFallback = vi.fn((_untilId: string | null, _sinceId: string | null, _limit: number) => Promise.resolve([] as MiNote[]));

		const ps = {
			redisTimelines: [`homeTimeline:${alice.id}`, 'localTimeline'] as FanoutTimelineName[],
			useDbFallback: true,
			limit: 10,
			allowPartial: false,
			excludePureRenotes: false,
			dbFallback,
			noteFilter: () => false, // Simulate strict filtering (force fallback)
			untilId: null,
			sinceId: null,
		};

		await service.getMiNotes(ps);

		expect(dbFallback).toHaveBeenCalled();
		const callArgs = dbFallback.mock.calls[0];
		const untilId = callArgs[0] as string;

		// We expect untilId to be the HTL oldest (htlNote3.id), NOT the LTL newest (ltlNote1.id).
		expect(untilId).toBe(htlNote3.id);
		expect(untilId > ltlNote1.id).toBe(true);
	});

	test('should maintain correct pagination cursor when using sinceId (ascending)', async () => {
		const now = Date.now();
		// Ascending: Oldest to Newest.
		const note1 = await createNote({ id: idService.gen(now - 3000) });
		const note2 = await createNote({ id: idService.gen(now - 2000) });
		const note3 = await createNote({ id: idService.gen(now - 1000) });

		const ids = [note1.id, note2.id, note3.id];

		fanoutTimelineService.getMulti.mockResolvedValue([ids]);

		// Mock dbFallback to return empty array
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const dbFallback = vi.fn((untilId: string | null, sinceId: string | null, limit: number) => Promise.resolve([] as MiNote[]));

		const ps = {
			redisTimelines: [`homeTimeline:${alice.id}`] as FanoutTimelineName[],
			useDbFallback: false, // Disable fallback to check Redis filtering logic directly
			limit: 2,
			allowPartial: true,
			excludePureRenotes: false,
			dbFallback,
			untilId: null,
			sinceId: idService.gen(now - 4000),
		};

		const result = await service.getMiNotes(ps);

		expect(result).toHaveLength(2);
		expect(result[0].id).toBe(note1.id);
		expect(result[1].id).toBe(note2.id);
	});

	test('should not fallback to DB when useDbFallback is false even if insufficient notes', async () => {
		const now = Date.now();
		const note1 = await createNote({ id: idService.gen(now) });
		const ids = [note1.id];

		fanoutTimelineService.getMulti.mockResolvedValue([ids]);

		const dbFallback = vi.fn((_untilId: string | null, _sinceId: string | null, _limit: number) => Promise.resolve([] as MiNote[]));

		const ps = {
			redisTimelines: [`homeTimeline:${alice.id}`] as FanoutTimelineName[],
			useDbFallback: false,
			limit: 10,
			allowPartial: false,
			excludePureRenotes: false,
			dbFallback,
			noteFilter: () => false, // Filter out everything
			untilId: null,
			sinceId: null,
		};

		const result = await service.getMiNotes(ps);

		expect(dbFallback).not.toHaveBeenCalled();
		expect(result).toEqual([]);
	});

	test('should merge disjoint timelines correctly when useDbFallback is false', async () => {
		const now = Date.now();
		// TL1: Recent
		const note1 = await createNote({ id: idService.gen(now - 1000) });
		const note2 = await createNote({ id: idService.gen(now - 2000) });
		// TL2: Old
		const note3 = await createNote({ id: idService.gen(now - 5000) });
		const note4 = await createNote({ id: idService.gen(now - 6000) });

		const ids1 = [note1.id, note2.id];
		const ids2 = [note3.id, note4.id];

		fanoutTimelineService.getMulti.mockResolvedValue([ids1, ids2]);

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const dbFallback = vi.fn((untilId: string | null, sinceId: string | null, limit: number) => Promise.resolve([] as MiNote[]));

		const ps = {
			redisTimelines: [`homeTimeline:${alice.id}`, 'localTimeline'] as FanoutTimelineName[],
			useDbFallback: false,
			limit: 10,
			allowPartial: true,
			excludePureRenotes: false,
			dbFallback,
			noteFilter: () => true, // Accept all
			untilId: null,
			sinceId: null,
		};

		const result = await service.getMiNotes(ps);

		// With the fixed logic (skipping filter when !useDbFallback), all notes should be present.
		expect(result).toHaveLength(4);
		expect(result.map(n => n.id)).toEqual([note1.id, note2.id, note3.id, note4.id]);
	});

	// Test for dummy ID optimization
	test('should inject dummy ID when DB fallback returns empty on initial load', async () => {
		const redisResult: string[][] = [[], []]; // Empty timelines

		fanoutTimelineService.getMulti.mockResolvedValue(redisResult);

		// Mock dbFallback to return empty array
		const dbFallback = vi.fn((_untilId: string | null, _sinceId: string | null, _limit: number) => Promise.resolve([] as MiNote[]));

		const ps = {
			redisTimelines: [`homeTimeline:${alice.id}`, 'localTimeline'] as FanoutTimelineName[],
			useDbFallback: true,
			limit: 10,
			allowPartial: true,
			excludePureRenotes: false,
			dbFallback,
			noteFilter: () => true,
			untilId: null,
			sinceId: null,
		};

		const result = await service.getMiNotes(ps);

		expect(result).toEqual([]);
		// Should have tried to inject dummy ID for both empty timelines
		expect(fanoutTimelineService.injectDummyIfEmpty).toHaveBeenCalledTimes(2);
		expect(fanoutTimelineService.injectDummyIfEmpty).toHaveBeenCalledWith(`homeTimeline:${alice.id}`, expect.any(String));
		expect(fanoutTimelineService.injectDummyIfEmpty).toHaveBeenCalledWith('localTimeline', expect.any(String));
	});

	// Test for behavior when dummy ID exists
	test('should return empty result when only dummy ID exists in Redis and DB has no newer data', async () => {
		const now = Date.now();
		const dummyId = idService.gen(now);
		// Redis has only dummy ID
		const redisResult: string[][] = [[dummyId]];

		fanoutTimelineService.getMulti.mockResolvedValue(redisResult);

		// Mock dbFallback (should be called to check for newer notes than the dummy ID)

		const dbFallback = vi.fn((_untilId: string | null, _sinceId: string | null, _limit: number) => Promise.resolve([] as MiNote[]));

		const ps = {
			redisTimelines: [`homeTimeline:${alice.id}`] as FanoutTimelineName[],
			useDbFallback: true,
			limit: 10,
			allowPartial: false,
			excludePureRenotes: false,
			dbFallback,
			noteFilter: () => true,
			untilId: null,
			sinceId: null,
		};

		const result = await service.getMiNotes(ps);

		expect(result).toEqual([]);
		// Fallback should be called to check for newer notes (ascending check from dummy ID)
		expect(dbFallback).toHaveBeenCalled();
	});

	test('should not inject dummy ID into shared or user timeline when DB has notes filtered out for viewer', async () => {
		// DB has a public local note by alice, so localTimeline and userTimeline:alice are NOT empty in DB
		await createNote({ visibility: 'public', userHost: null });

		const redisResult: string[][] = [[], [], []];
		fanoutTimelineService.getMulti.mockResolvedValue(redisResult);

		// Simulate viewer-filtered dbFallback returning empty (e.g. muted/blocked by viewer)
		const dbFallback = vi.fn((_untilId: string | null, _sinceId: string | null, _limit: number) => Promise.resolve([] as MiNote[]));

		const ps = {
			redisTimelines: [`homeTimeline:${alice.id}`, 'localTimeline', `userTimeline:${alice.id}`] as FanoutTimelineName[],
			useDbFallback: true,
			limit: 10,
			allowPartial: true,
			excludePureRenotes: false,
			dbFallback,
			noteFilter: () => true,
			untilId: null,
			sinceId: null,
		};

		const result = await service.getMiNotes(ps);

		expect(result).toEqual([]);
		// Only viewer-private homeTimeline should receive dummy ID; localTimeline and userTimeline must not be polluted
		expect(fanoutTimelineService.injectDummyIfEmpty).toHaveBeenCalledTimes(1);
		expect(fanoutTimelineService.injectDummyIfEmpty).toHaveBeenCalledWith(`homeTimeline:${alice.id}`, expect.any(String));
		expect(fanoutTimelineService.injectDummyIfEmpty).not.toHaveBeenCalledWith('localTimeline', expect.any(String));
		expect(fanoutTimelineService.injectDummyIfEmpty).not.toHaveBeenCalledWith(`userTimeline:${alice.id}`, expect.any(String));
	});

	test('should detect gen(1) dummy ID as trusted empty and avoid DB fallback when another source has notes', async () => {
		const now = Date.now();
		const note1 = await createNote({ id: idService.gen(now - 1000) });
		const dummyId = idService.gen(1);

		// First source has only dummyId(gen(1)), second source has note1
		fanoutTimelineService.getMulti.mockResolvedValue([[dummyId], [note1.id]]);

		const dbFallback = vi.fn((_untilId: string | null, _sinceId: string | null, _limit: number) => Promise.resolve([] as MiNote[]));

		const ps = {
			redisTimelines: [`userTimelineWithReplies:${alice.id}`, `userTimeline:${alice.id}`] as FanoutTimelineName[],
			useDbFallback: true,
			limit: 10,
			allowPartial: true,
			excludePureRenotes: false,
			dbFallback,
			noteFilter: () => true,
			untilId: null,
			sinceId: null,
		};

		const result = await service.getMiNotes(ps);

		expect(dbFallback).not.toHaveBeenCalled();
		expect(result.map(n => n.id)).toEqual([note1.id]);
	});
});
