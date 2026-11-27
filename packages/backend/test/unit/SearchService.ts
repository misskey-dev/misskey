/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { createServer, type Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { MeilisearchApiError } from 'meilisearch';
import type { Index, Meilisearch } from 'meilisearch';
import { type Config, loadConfig } from '@/config.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { QueueService } from '@/core/QueueService.js';
import { QueryService } from '@/core/QueryService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { QueueLoggerService } from '@/queue/QueueLoggerService.js';
import { SearchIndexMaintenanceQueue } from '@/queue/SearchIndexMaintenanceQueue.js';
import { SearchIndexMaintenanceProcessorService } from '@/queue/processors/SearchIndexMaintenanceProcessorService.js';
import ResetIndexEndpoint from '@/server/api/endpoints/admin/search/reset.js';
import { MeilisearchTaskFailedError, SearchService } from '@/core/SearchService.js';
import type { RunSearchIndexMutation } from '@/core/SearchService.js';
import { CacheService } from '@/core/CacheService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import {
	type BlockingsRepository,
	type ChannelsRepository,
	type FollowingsRepository,
	type MutingsRepository,
	type NotesRepository,
	type UserProfilesRepository,
	type UsersRepository,
	type MiChannel,
	type MiNote,
	type MiUser,
} from '@/models/_.js';

describe('SearchService', () => {
	type TestContext = {
		app: TestingModule;
		service: SearchService;
		cacheService: CacheService;
		idService: IdService;
		mutingsRepository: MutingsRepository;
		blockingsRepository: BlockingsRepository;
		usersRepository: UsersRepository;
		userProfilesRepository: UserProfilesRepository;
		notesRepository: NotesRepository;
		channelsRepository: ChannelsRepository;
		followingsRepository: FollowingsRepository;
		indexer?: (note: MiNote) => Promise<void>;
	};

	const meilisearchSettings = {
		searchableAttributes: [
			'text',
			'cw',
		],
		sortableAttributes: [
			'createdAt',
		],
		filterableAttributes: [
			'createdAt',
			'userId',
			'userHost',
			'channelId',
			'tags',
		],
		typoTolerance: {
			enabled: false,
		},
		pagination: {
			maxTotalHits: 10000,
		},
	};

	async function buildContext(configOverride?: Config): Promise<TestContext> {
		const builder = Test.createTestingModule({
			imports: [
				GlobalModule,
				CoreModule,
			],
		});

		if (configOverride) {
			builder.overrideProvider(DI.config).useValue(configOverride);
		}

		const app = await builder.compile();

		app.enableShutdownHooks();

		return {
			app,
			service: app.get(SearchService),
			cacheService: app.get(CacheService),
			idService: app.get(IdService),
			mutingsRepository: app.get(DI.mutingsRepository),
			blockingsRepository: app.get(DI.blockingsRepository),
			usersRepository: app.get(DI.usersRepository),
			userProfilesRepository: app.get(DI.userProfilesRepository),
			notesRepository: app.get(DI.notesRepository),
			channelsRepository: app.get(DI.channelsRepository),
			followingsRepository: app.get(DI.followingsRepository),
		};
	}

	async function cleanupContext(ctx: TestContext) {
		await ctx.notesRepository.createQueryBuilder().delete().execute();
		await ctx.mutingsRepository.createQueryBuilder().delete().execute();
		await ctx.blockingsRepository.createQueryBuilder().delete().execute();
		await ctx.followingsRepository.createQueryBuilder().delete().execute();
		await ctx.channelsRepository.createQueryBuilder().delete().execute();
		await ctx.userProfilesRepository.createQueryBuilder().delete().execute();
		await ctx.usersRepository.createQueryBuilder().delete().execute();
	}

	async function createUser(ctx: TestContext, data: Partial<MiUser> = {}) {
		const id = ctx.idService.gen();
		const username = data.username ?? `user_${id}`;
		const usernameLower = data.usernameLower ?? username.toLowerCase();

		const user = await ctx.usersRepository
			.insert({
				id,
				username,
				usernameLower,
				...data,
			})
			.then(x => ctx.usersRepository.findOneByOrFail(x.identifiers[0]));

		await ctx.userProfilesRepository.insert({
			userId: id,
		});

		return user;
	}

	async function createChannel(ctx: TestContext, user: MiUser, data: Partial<MiChannel> = {}) {
		const id = ctx.idService.gen();
		const channel = await ctx.channelsRepository
			.insert({
				id,
				userId: user.id,
				name: data.name ?? `channel_${id}`,
				...data,
			})
			.then(x => ctx.channelsRepository.findOneByOrFail(x.identifiers[0]));

		return channel;
	}

	async function createNote(ctx: TestContext, user: MiUser, data: Partial<MiNote> = {}, time?: number) {
		const id = time == null ? ctx.idService.gen() : ctx.idService.gen(time);
		const note = await ctx.notesRepository
			.insert({
				id,
				text: 'hello',
				userId: user.id,
				userHost: user.host,
				visibility: 'public',
				tags: [],
				...data,
			})
			.then(x => ctx.notesRepository.findOneByOrFail(x.identifiers[0]));

		if (ctx.indexer) {
			await ctx.indexer(note);
		}

		return note;
	}

	async function createFollowing(ctx: TestContext, follower: MiUser, followee: MiUser) {
		await ctx.followingsRepository.insert({
			id: ctx.idService.gen(),
			followerId: follower.id,
			followeeId: followee.id,
			followerHost: follower.host,
			followeeHost: followee.host,
		});
	}

	function clearUserCaches(ctx: TestContext, userId: MiUser['id']) {
		ctx.cacheService.userMutingsCache.delete(userId);
		ctx.cacheService.userBlockedCache.delete(userId);
		ctx.cacheService.userBlockingCache.delete(userId);
	}

	async function createMuting(ctx: TestContext, muter: MiUser, mutee: MiUser) {
		await ctx.mutingsRepository.insert({
			id: ctx.idService.gen(),
			muterId: muter.id,
			muteeId: mutee.id,
		});
		clearUserCaches(ctx, muter.id);
	}

	async function createBlocking(ctx: TestContext, blocker: MiUser, blockee: MiUser) {
		await ctx.blockingsRepository.insert({
			id: ctx.idService.gen(),
			blockerId: blocker.id,
			blockeeId: blockee.id,
		});
		clearUserCaches(ctx, blocker.id);
		clearUserCaches(ctx, blockee.id);
	}

	function defineSearchNoteTests(
		getCtx: () => TestContext,
		{
			supportsFollowersVisibility,
			sinceIdOrder,
		}: {
			supportsFollowersVisibility: boolean;
			sinceIdOrder: 'asc' | 'desc';
		},
	) {
		describe('searchNote', () => {
			test('filters notes by visibility (followers only visible to followers)', async () => {
				const ctx = getCtx();
				const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
				const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

				const publicNote = await createNote(ctx, author, { text: 'hello public', visibility: 'public' });
				const followersNote = await createNote(ctx, author, { text: 'hello followers', visibility: 'followers' });

				const beforeFollow = await ctx.service.searchNote('hello', me, {}, { limit: 10 });
				expect(beforeFollow.map(note => note.id)).toEqual([publicNote.id]);

				await createFollowing(ctx, me, author);

				const afterFollow = await ctx.service.searchNote('hello', me, {}, { limit: 10 });
				const expectedIds = supportsFollowersVisibility
					? [followersNote.id, publicNote.id]
					: [publicNote.id];
				expect(afterFollow.map(note => note.id).sort()).toEqual(expectedIds.sort());
			});

			test('filters out suspended users via base note filtering', async () => {
				const ctx = getCtx();
				const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
				const active = await createUser(ctx, { username: 'active', usernameLower: 'active', host: null });
				const suspended = await createUser(ctx, { username: 'suspended', usernameLower: 'suspended', host: null, isSuspended: true });

				const activeNote = await createNote(ctx, active, { text: 'hello active', visibility: 'public' });
				await createNote(ctx, suspended, { text: 'hello suspended', visibility: 'public' });

				const result = await ctx.service.searchNote('hello', me, {}, { limit: 10 });
				expect(result.map(note => note.id)).toEqual([activeNote.id]);
			});

			test('filters by userId', async () => {
				const ctx = getCtx();
				const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
				const alice = await createUser(ctx, { username: 'alice', usernameLower: 'alice', host: null });
				const bob = await createUser(ctx, { username: 'bob', usernameLower: 'bob', host: null });

				const aliceNote = await createNote(ctx, alice, { text: 'hello alice', visibility: 'public' });
				await createNote(ctx, bob, { text: 'hello bob', visibility: 'public' });

				const result = await ctx.service.searchNote('hello', me, { userId: alice.id }, { limit: 10 });
				expect(result.map(note => note.id)).toEqual([aliceNote.id]);
			});

			test('filters by channelId', async () => {
				const ctx = getCtx();
				const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
				const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });
				const channelA = await createChannel(ctx, author, { name: 'channel-a' });
				const channelB = await createChannel(ctx, author, { name: 'channel-b' });

				const channelNote = await createNote(ctx, author, { text: 'hello channel', channelId: channelA.id, visibility: 'public' });
				await createNote(ctx, author, { text: 'hello other', channelId: channelB.id, visibility: 'public' });

				const result = await ctx.service.searchNote('hello', me, { channelId: channelA.id }, { limit: 10 });
				expect(result.map(note => note.id)).toEqual([channelNote.id]);
			});

			test('filters by host', async () => {
				const ctx = getCtx();
				const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
				const local = await createUser(ctx, { username: 'local', usernameLower: 'local', host: null });
				const remote = await createUser(ctx, { username: 'remote', usernameLower: 'remote', host: 'example.com' });

				const localNote = await createNote(ctx, local, { text: 'hello local', visibility: 'public' });
				const remoteNote = await createNote(ctx, remote, { text: 'hello remote', visibility: 'public', userHost: 'example.com' });

				const localResult = await ctx.service.searchNote('hello', me, { host: '.' }, { limit: 10 });
				expect(localResult.map(note => note.id)).toEqual([localNote.id]);

				const remoteResult = await ctx.service.searchNote('hello', me, { host: 'example.com' }, { limit: 10 });
				expect(remoteResult.map(note => note.id)).toEqual([remoteNote.id]);
			});

			describe('date range', () => {
				test('filters notes after rangeStartAt', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

					const t1 = Date.now() - 3000;
					const t2 = Date.now() - 2000;
					const t3 = Date.now() - 1000;

					await createNote(ctx, author, { text: 'hello old' }, t1);
					const note2 = await createNote(ctx, author, { text: 'hello middle' }, t2);
					const note3 = await createNote(ctx, author, { text: 'hello new' }, t3);

					const result = await ctx.service.searchNote('hello', me, { rangeStartAt: t2 }, { limit: 10 });
					expect(result.map(note => note.id)).toEqual([note3.id, note2.id]);
				});

				test('filters notes before rangeEndAt', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

					const t1 = Date.now() - 3000;
					const t2 = Date.now() - 2000;
					const t3 = Date.now() - 1000;

					const note1 = await createNote(ctx, author, { text: 'hello old' }, t1);
					const note2 = await createNote(ctx, author, { text: 'hello middle' }, t2);
					await createNote(ctx, author, { text: 'hello new' }, t3);

					const result = await ctx.service.searchNote('hello', me, { rangeEndAt: t2 }, { limit: 10 });
					expect(result.map(note => note.id)).toEqual([note2.id, note1.id]);
				});

				test('filters notes between rangeStartAt and rangeEndAt', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

					const t1 = Date.now() - 4000;
					const t2 = Date.now() - 3000;
					const t3 = Date.now() - 2000;
					const t4 = Date.now() - 1000;

					await createNote(ctx, author, { text: 'hello old' }, t1);
					const note2 = await createNote(ctx, author, { text: 'hello middle' }, t2);
					const note3 = await createNote(ctx, author, { text: 'hello newer' }, t3);
					await createNote(ctx, author, { text: 'hello new' }, t4);

					const result = await ctx.service.searchNote('hello', me, { rangeStartAt: t2, rangeEndAt: t3 }, { limit: 10 });
					expect(result.map(note => note.id)).toEqual([note3.id, note2.id]);
				});

				test('keeps pagination within date range when sinceId and untilId are outside range', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

					const t1 = Date.now() - 8000;
					const t2 = Date.now() - 7000;
					const t3 = Date.now() - 6000;
					const t4 = Date.now() - 5000;
					const t5 = Date.now() - 4000;
					const t6 = Date.now() - 3000;
					const t7 = Date.now() - 2000;
					const t8 = Date.now() - 1000;

					await createNote(ctx, author, { text: 'hello outside oldest' }, t1);
					const sinceCursor = await createNote(ctx, author, { text: 'hello since cursor before range' }, t2);
					const beforeRange = await createNote(ctx, author, { text: 'hello before range but after since' }, t3);
					const note4 = await createNote(ctx, author, { text: 'hello range old' }, t4);
					const note5 = await createNote(ctx, author, { text: 'hello range middle' }, t5);
					const note6 = await createNote(ctx, author, { text: 'hello range new' }, t6);
					const afterRange = await createNote(ctx, author, { text: 'hello after range but before until' }, t7);
					const untilCursor = await createNote(ctx, author, { text: 'hello until cursor after range' }, t8);

					const result = await ctx.service.searchNote(
						'hello',
						me,
						{ rangeStartAt: t4, rangeEndAt: t6 },
						{ limit: 10, sinceId: sinceCursor.id, untilId: untilCursor.id },
					);
					const resultIds = result.map(note => note.id);
					expect(resultIds).toEqual([note6.id, note5.id, note4.id]);
					expect(resultIds).not.toContain(beforeRange.id);
					expect(resultIds).not.toContain(afterRange.id);
				});

				test('uses sinceId and untilId as pagination boundaries inside date range', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

					const t1 = Date.now() - 8000;
					const t2 = Date.now() - 7000;
					const t3 = Date.now() - 6000;
					const t4 = Date.now() - 5000;
					const t5 = Date.now() - 4000;
					const t6 = Date.now() - 3000;
					const t7 = Date.now() - 2000;
					const t8 = Date.now() - 1000;

					await createNote(ctx, author, { text: 'hello before range' }, t1);
					const rangeOldest = await createNote(ctx, author, { text: 'hello range oldest' }, t2);
					const sinceCursor = await createNote(ctx, author, { text: 'hello since cursor in range' }, t3);
					const note4 = await createNote(ctx, author, { text: 'hello page old' }, t4);
					const note5 = await createNote(ctx, author, { text: 'hello page new' }, t5);
					const untilCursor = await createNote(ctx, author, { text: 'hello until cursor in range' }, t6);
					const rangeNewest = await createNote(ctx, author, { text: 'hello range newest' }, t7);
					await createNote(ctx, author, { text: 'hello after range' }, t8);

					const result = await ctx.service.searchNote(
						'hello',
						me,
						{ rangeStartAt: t2, rangeEndAt: t7 },
						{ limit: 10, sinceId: sinceCursor.id, untilId: untilCursor.id },
					);
					const resultIds = result.map(note => note.id);
					expect(resultIds).toEqual([note5.id, note4.id]);
					expect(resultIds).not.toContain(rangeOldest.id);
					expect(resultIds).not.toContain(rangeNewest.id);
				});
			});

			describe('muting and blocking', () => {
				test('filters out muted users', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const muted = await createUser(ctx, { username: 'muted', usernameLower: 'muted', host: null });
					const other = await createUser(ctx, { username: 'other', usernameLower: 'other', host: null });

					await createNote(ctx, muted, { text: 'hello muted', visibility: 'public' });
					const otherNote = await createNote(ctx, other, { text: 'hello other', visibility: 'public' });

					await createMuting(ctx, me, muted);

					const result = await ctx.service.searchNote('hello', me, {}, { limit: 10 });

					expect(result.map(note => note.id)).toEqual([otherNote.id]);
				});

				test('filters out users who block me', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const blocker = await createUser(ctx, { username: 'blocker', usernameLower: 'blocker', host: null });
					const other = await createUser(ctx, { username: 'other', usernameLower: 'other', host: null });

					await createNote(ctx, blocker, { text: 'hello blocker', visibility: 'public' });
					const otherNote = await createNote(ctx, other, { text: 'hello other', visibility: 'public' });

					await createBlocking(ctx, blocker, me);

					const result = await ctx.service.searchNote('hello', me, {}, { limit: 10 });

					expect(result.map(note => note.id)).toEqual([otherNote.id]);
				});

				test('filters no out users I block', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const blocked = await createUser(ctx, { username: 'blocked', usernameLower: 'blocked', host: null });
					const other = await createUser(ctx, { username: 'other', usernameLower: 'other', host: null });

					const blockedNote = await createNote(ctx, blocked, { text: 'hello blocked', visibility: 'public' });
					const otherNote = await createNote(ctx, other, { text: 'hello other', visibility: 'public' });

					await createBlocking(ctx, me, blocked);

					const result = await ctx.service.searchNote('hello', me, {}, { limit: 10 });
					expect(result.map(note => note.id).sort()).toEqual([otherNote.id, blockedNote.id].sort());
				});
			});

			describe('pagination', () => {
				test('paginates with sinceId', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

					const t1 = Date.now() - 3000;
					const t2 = Date.now() - 2000;
					const t3 = Date.now() - 1000;

					const note1 = await createNote(ctx, author, { text: 'hello' }, t1);
					const note2 = await createNote(ctx, author, { text: 'hello' }, t2);
					const note3 = await createNote(ctx, author, { text: 'hello' }, t3);

					const result = await ctx.service.searchNote('hello', me, {}, { limit: 10, sinceId: note1.id });

					const expected = sinceIdOrder === 'asc'
						? [note2.id, note3.id]
						: [note3.id, note2.id];
					expect(result.map(note => note.id)).toEqual(expected);
				});

				test('paginates with untilId', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

					const t1 = Date.now() - 3000;
					const t2 = Date.now() - 2000;
					const t3 = Date.now() - 1000;

					const note1 = await createNote(ctx, author, { text: 'hello' }, t1);
					const note2 = await createNote(ctx, author, { text: 'hello' }, t2);
					const note3 = await createNote(ctx, author, { text: 'hello' }, t3);

					const result = await ctx.service.searchNote('hello', me, {}, { limit: 10, untilId: note3.id });

					expect(result.map(note => note.id)).toEqual([note2.id, note1.id]);
				});

				test('paginates with sinceId and untilId together', async () => {
					const ctx = getCtx();
					const me = await createUser(ctx, { username: 'me', usernameLower: 'me', host: null });
					const author = await createUser(ctx, { username: 'author', usernameLower: 'author', host: null });

					const t1 = Date.now() - 4000;
					const t2 = Date.now() - 3000;
					const t3 = Date.now() - 2000;
					const t4 = Date.now() - 1000;

					const note1 = await createNote(ctx, author, { text: 'hello' }, t1);
					const note2 = await createNote(ctx, author, { text: 'hello' }, t2);
					const note3 = await createNote(ctx, author, { text: 'hello' }, t3);
					const note4 = await createNote(ctx, author, { text: 'hello' }, t4);

					const result = await ctx.service.searchNote('hello', me, {}, { limit: 10, sinceId: note1.id, untilId: note4.id });

					expect(result.map(note => note.id)).toEqual([note3.id, note2.id]);
				});
			});
		});
	}

	describe('sqlLike', () => {
		let ctx: TestContext;

		beforeAll(async () => {
			ctx = await buildContext();
		});

		afterAll(async () => {
			await ctx.app.close();
		});

		afterEach(async () => {
			await cleanupContext(ctx);
		});

		defineSearchNoteTests(() => ctx, { supportsFollowersVisibility: true, sinceIdOrder: 'asc' });
	});

	describe('meilisearch', () => {
		let ctx: TestContext;
		let meilisearch: Meilisearch;
		let meilisearchIndex: Index;
		let meiliConfig: Config;

		beforeAll(async () => {
			const baseConfig = loadConfig();
			meiliConfig = {
				...baseConfig,
				fulltextSearch: {
					provider: 'meilisearch',
				},
				meilisearch: {
					host: '127.0.0.1',
					port: '57712',
					apiKey: '',
					index: 'test-search-service',
					scope: 'global',
					ssl: false,
				},
			};

			ctx = await buildContext(meiliConfig);
			meilisearch = ctx.app.get(DI.meilisearch) as Meilisearch;
			meilisearchIndex = meilisearch.index(`${meiliConfig.meilisearch!.index}---notes`);

			const settingsTask = await meilisearchIndex.updateSettings(meilisearchSettings);
			await meilisearch.tasks.waitForTask(settingsTask.taskUid);

			const clearTask = await meilisearchIndex.deleteAllDocuments();
			await meilisearch.tasks.waitForTask(clearTask.taskUid);

			ctx.indexer = async (note: MiNote) => {
				if (note.text == null && note.cw == null) return;
				if (!['home', 'public'].includes(note.visibility)) return;
				if (meiliConfig.meilisearch?.scope === 'local' && note.userHost != null) return;

				const task = await meilisearchIndex.addDocuments([{
					id: note.id,
					createdAt: ctx.idService.parse(note.id).date.getTime(),
					userId: note.userId,
					userHost: note.userHost,
					channelId: note.channelId,
					cw: note.cw,
					text: note.text,
					tags: note.tags,
				}], {
					primaryKey: 'id',
				});
				await meilisearch.tasks.waitForTask(task.taskUid);
			};
		});

		afterAll(async () => {
			await ctx.app.close();
		});

		afterEach(async () => {
			await cleanupContext(ctx);
			const clearTask = await meilisearchIndex.deleteAllDocuments();
			await meilisearch.tasks.waitForTask(clearTask.taskUid);
		});


		const runMutation: RunSearchIndexMutation = async (submit, noteIds) => {
			const taskUid = await submit();
			await ctx.service.waitForMeilisearchTask(taskUid);
			const indexedCount = noteIds == null ? undefined : await ctx.service.reconcileIndexedNotes(noteIds, runMutation);
			return { taskUid, indexedCount };
		};

		test('backfills the selected period across batches and preserves indexed notes outside it', async () => {
			const user = await createUser(ctx);
			const sinceDate = Date.now() - 10_000;
			const untilDate = sinceDate + 1000;
			const existing = await createNote(ctx, user, {}, sinceDate - 1);
			const unindexed = { ...ctx, indexer: undefined };
			const ids = Array.from({ length: 101 }, () => ctx.idService.gen(sinceDate));
			await ctx.notesRepository.insert(ids.map(id => ({ id, userId: user.id, text: 'backfill', visibility: 'home' })));
			await createNote(unindexed, user, {}, untilDate);
			await createNote(unindexed, user, { visibility: 'followers', cw: 'private' }, sinceDate);
			await createNote(unindexed, user, { text: null, cw: null }, sinceDate);
			const cwOnly = await createNote(unindexed, user, { text: null, cw: 'content warning' }, sinceDate);
			const onBatch = vi.fn();

			await ctx.service.reIndexNotes({ sinceDate, untilDate, onBatch, runMutation });

			expect(onBatch.mock.calls.map(([count]) => count)).toEqual([100, 102]);
			const documents = await meilisearchIndex.getDocuments({ limit: 200 });
			expect(documents.results.map(doc => doc.id).sort()).toEqual([...ids, existing.id, cwOnly.id].sort());
		});

		test('removes backfilled search documents whose notes were deleted during the batch', async () => {
			const user = await createUser(ctx);
			const note = await createNote({ ...ctx, indexer: undefined }, user);
			const indexedCount = vi.fn();
			const getTask = meilisearch.tasks.getTask.bind(meilisearch.tasks);
			vi.spyOn(meilisearch.tasks, 'getTask').mockImplementationOnce(async (...args) => {
				await ctx.notesRepository.delete(note.id);
				return await getTask(...args);
			});
			const createRunner = vi.spyOn(ctx.notesRepository.manager.connection, 'createQueryRunner');

			await ctx.service.reIndexNotes({ onBatch: indexedCount, runMutation });

			expect(createRunner).toHaveBeenCalledWith('master');

			expect((await meilisearchIndex.getDocuments()).results).toEqual([]);
			expect(indexedCount).toHaveBeenCalledExactlyOnceWith(0);
		});

		test('keeps local notes and filters remote notes to the configured hosts', async () => {
			const scopedSearch = new SearchService(
				{ ...meiliConfig, meilisearch: { ...meiliConfig.meilisearch!, scope: ['allowed.example'] } },
				meilisearch,
				ctx.notesRepository,
				ctx.cacheService,
				ctx.app.get(QueryService),
				ctx.idService,
				ctx.app.get(LoggerService),
				ctx.app.get(DI.meta),
			);
			const unindexed = { ...ctx, indexer: undefined };
			const localUser = await createUser(ctx);
			const includedUser = await createUser(ctx, { host: 'allowed.example' });
			const excludedUser = await createUser(ctx, { host: 'excluded.example' });
			const localNote = await createNote(unindexed, localUser);
			const includedNote = await createNote(unindexed, includedUser);
			await createNote(unindexed, excludedUser);

			expect(await scopedSearch.reIndexNotes({ runMutation })).toBe(2);
			const docs = await meilisearchIndex.getDocuments();
			expect(docs.results.map(doc => doc.id).sort()).toEqual([localNote.id, includedNote.id].sort());
		});

		test('clears only note search documents and preserves settings and source notes', async () => {
			const user = await createUser(ctx);
			const note = await createNote(ctx, user);
			const settings = await meilisearchIndex.getSettings();

			await ctx.service.clearNoteIndex(runMutation);

			expect((await meilisearchIndex.getDocuments()).results).toEqual([]);
			expect(await ctx.notesRepository.findOneBy({ id: note.id })).not.toBeNull();
			expect(await meilisearchIndex.getSettings()).toEqual(settings);
		});

		test('reports a failed Meilisearch task and does not advance progress', async () => {
			const user = await createUser(ctx);
			await createNote(ctx, user);
			const onBatch = vi.fn();
			const getTask = meilisearch.tasks.getTask.bind(meilisearch.tasks);
			vi.spyOn(meilisearch.tasks, 'getTask').mockImplementationOnce(async (...args) => {
				const task = await getTask(...args);
				return { ...task, status: 'failed' };
			});

			await expect(ctx.service.reIndexNotes({ onBatch, runMutation })).rejects.toBeInstanceOf(MeilisearchTaskFailedError);
			expect(onBatch).not.toHaveBeenCalled();
		});

		test('retries transient task-status errors while waiting for the same task', async () => {
			const task = await meilisearchIndex.updateSettings(meilisearchSettings);
			const getTask = vi.spyOn(meilisearch.tasks, 'getTask')
				.mockRejectedValueOnce(new MeilisearchApiError(new Response(null, { status: 502 })));

			await ctx.service.waitForMeilisearchTask(task.taskUid);

			expect(getTask.mock.calls.length).toBeGreaterThanOrEqual(2);
			expect(getTask.mock.calls.every(([uid]) => uid === task.taskUid)).toBe(true);
		});

		test('accepts only one simultaneous request across the CLI and admin API', async () => {
			const user = await createUser(ctx);
			const queue = ctx.app.get(QueueService);
			const endpoint = new ResetIndexEndpoint(queue);
			await expect(endpoint.exec({ confirm: false }, user as never, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });
			await expect(endpoint.exec({}, user as never, null)).rejects.toMatchObject({ code: 'INVALID_PARAM' });

			const results = await Promise.allSettled([
				queue.enqueueSearchIndexMaintenance({ operation: 'reindex' }, null),
				endpoint.exec({ confirm: true }, user as never, null),
			]);
			const accepted = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);

			try {
				expect(accepted).toHaveLength(1);
				const rejected = results.find(result => result.status === 'rejected');
				expect(rejected).toMatchObject({ reason: { code: 'ALREADY_RUNNING' } });
				expect(await queue.queueRetryJob('searchIndexMaintenance', accepted[0].jobId)).toBe(false);
			} finally {
				for (const { jobId } of accepted) await queue.queueRemoveJob('searchIndexMaintenance', jobId);
			}
		});

		test('does not replay a reset after losing the submission response and can resume a known task', async () => {
			const maintenance = ctx.app.get(SearchIndexMaintenanceQueue);
			const { jobId } = await maintenance.enqueue({ operation: 'reset' }, null);
			const submit = vi.fn().mockRejectedValue(new Error('Missing response'));
			const clear = vi.spyOn(ctx.service, 'clearNoteIndex').mockImplementation(async run => (await run(submit)).taskUid);
			const wait = vi.spyOn(ctx.service, 'waitForMeilisearchTask').mockResolvedValue();
			const processor = new SearchIndexMaintenanceProcessorService(ctx.service, maintenance, ctx.app.get(ModerationLogService), new QueueLoggerService(ctx.app.get(LoggerService)));
			const client = await maintenance.queue.getBackend().client;
			const lockKey = maintenance.queue.toKey(`${jobId}:lock`);

			try {
				const job = (await maintenance.queue.getJob(jobId))!;
				job.token = 'current-lock';
				await client.set(lockKey, job.token);
				await expect(processor.process(job)).rejects.toThrow('Missing response');
				const resumed = (await maintenance.queue.getJob(jobId))!;
				await expect(processor.process(resumed)).rejects.toThrow('may have been submitted');

				const pending = await maintenance.getPendingMutation();
				expect(pending).toMatchObject({ jobId, taskUid: undefined });
				await maintenance.recordTask(pending!, 0);
				await expect(processor.process(resumed)).resolves.toContain('task 0');
				expect(wait).toHaveBeenCalledExactlyOnceWith(0, undefined);
				expect(clear).toHaveBeenCalledTimes(1);
				expect(submit).toHaveBeenCalledTimes(1);
				expect(await maintenance.getPendingMutation()).toBeNull();
			} finally {
				await client.del(lockKey, maintenance.queue.toKey('pending-mutation'));
				await maintenance.queue.remove(jobId);
			}
		});

		test('a replacement worker removes stale documents from a previously submitted reindex batch', async () => {
			const user = await createUser(ctx);
			const deleted = await createNote({ ...ctx, indexer: undefined }, user);
			const maintenance = ctx.app.get(SearchIndexMaintenanceQueue);
			const processor = new SearchIndexMaintenanceProcessorService(ctx.service, maintenance, ctx.app.get(ModerationLogService), new QueueLoggerService(ctx.app.get(LoggerService)));
			const { jobId } = await maintenance.enqueue({ operation: 'reindex' }, null);
			const client = await maintenance.queue.getBackend().client;
			const lockKey = maintenance.queue.toKey(`${jobId}:lock`);

			try {
				const original = (await maintenance.queue.getJob(jobId))!;
				original.token = 'first-worker';
				await client.set(lockKey, original.token);
				const mutation = await maintenance.beginMutation(original, [deleted.id]);

				await ctx.notesRepository.delete(deleted.id);
				const staleAdd = await meilisearchIndex.addDocuments([{ id: deleted.id, text: deleted.text }], { primaryKey: 'id' });
				await maintenance.recordTask(mutation, staleAdd.taskUid);
				await ctx.service.waitForMeilisearchTask(staleAdd.taskUid);

				const resumed = (await maintenance.queue.getJob(jobId))!;
				resumed.token = 'replacement-worker';
				await client.set(lockKey, resumed.token);
				await expect(processor.process(resumed)).resolves.toContain('Re-indexed 0 notes');
				expect((await meilisearchIndex.getDocuments()).results).toEqual([]);
				expect(await maintenance.getPendingMutation()).toBeNull();
			} finally {
				await client.del(lockKey, maintenance.queue.toKey('pending-mutation'));
				await maintenance.queue.remove(jobId);
			}
		});

		test('CLI reset submits a job without initializing search settings or connecting to PostgreSQL', async () => {
			const instance = `test-cli-${randomUUID()}`;
			const redis = { ...meiliConfig.redisForJobQueue, prefix: instance };
			const meilisearchConfig = { ...meiliConfig.meilisearch!, index: instance };
			const maintenance = new SearchIndexMaintenanceQueue({ ...meiliConfig, redisForJobQueue: redis });
			const index = meilisearch.index(`${instance}---notes`);
			const tempDir = await mkdtemp(join(tmpdir(), 'misskey-meilisearch-cli-'));
			const configPath = join(tempDir, 'config.yml');
			const settings = { pagination: { maxTotalHits: 4321 } };
			try {
				await meilisearch.tasks.waitForTask(await index.updateSettings(settings));
				await writeFile(configPath, JSON.stringify({
					url: meiliConfig.url, port: meiliConfig.port, id: meiliConfig.id,
					db: { ...meiliConfig.db, port: 1 }, redis, redisForJobQueue: redis,
					fulltextSearch: { provider: 'meilisearch' }, meilisearch: meilisearchConfig,
				}));
				const { stdout } = await promisify(execFile)(process.execPath, ['./built/cli.js', 'meilisearch-reset', '--confirm'], {
					env: { ...process.env, MISSKEY_CONFIG_YML: configPath },
					timeout: 10_000,
				});

				expect(stdout).toContain('Meilisearch maintenance job queued:');
				expect((await index.getSettings()).pagination).toEqual(settings.pagination);
				expect(await maintenance.queue.getWaitingCount()).toBe(1);
			} finally {
				await maintenance.queue.obliterate({ force: true });
				await maintenance.queue.close();
				await meilisearch.tasks.waitForTask(await index.delete());
				await rm(tempDir, { recursive: true, force: true });
			}
		});

		test('CLI terminates on bootstrap failure despite unavailable Redis', async () => {
			const tempDir = await mkdtemp(join(tmpdir(), 'misskey-meilisearch-cli-'));
			try {
				const configPath = join(tempDir, 'config.yml');
				await writeFile(configPath, JSON.stringify({
					url: meiliConfig.url, port: meiliConfig.port, id: meiliConfig.id,
					db: { ...meiliConfig.db, port: 1 }, redis: { ...meiliConfig.redis, port: 1 },
					fulltextSearch: { provider: 'meilisearch' },
				}));

				await expect(promisify(execFile)(process.execPath, ['./built/cli.js', 'meilisearch-reset', '--confirm'], {
					env: { ...process.env, MISSKEY_CONFIG_YML: configPath },
					timeout: 7_000,
				})).rejects.toMatchObject({ code: 1, killed: false, stderr: expect.stringContaining('Meilisearch provider is not active') });
				await expect(promisify(execFile)(process.execPath, ['./built/cli.js', 'ping'], {
					env: { ...process.env, MISSKEY_CONFIG_YML: configPath },
					timeout: 7_000,
				})).rejects.toMatchObject({ code: 1, killed: false });
				await writeFile(configPath, JSON.stringify({
					url: meiliConfig.url, port: meiliConfig.port, id: meiliConfig.id,
					db: { ...meiliConfig.db, port: 1 }, redis: { ...meiliConfig.redis, port: 1 },
					fulltextSearch: { provider: 'meilisearch' }, meilisearch: meiliConfig.meilisearch,
				}));
				await expect(promisify(execFile)(process.execPath, ['./built/cli.js', 'meilisearch-reset', '--confirm'], {
					env: { ...process.env, MISSKEY_CONFIG_YML: configPath },
					timeout: 7_000,
				})).rejects.toMatchObject({ code: 1, killed: false });
			} finally {
				await rm(tempDir, { recursive: true, force: true });
			}
		});

		test('CLI exits when Redis accepts the connection but does not reply', async () => {
			let acceptedConnection = false;
			const sockets = new Set<Socket>();
			const silentServer = createServer(socket => {
				acceptedConnection = true;
				sockets.add(socket);
				socket.once('close', () => sockets.delete(socket));
			});
			const tempDir = await mkdtemp(join(tmpdir(), 'misskey-meilisearch-cli-'));
			try {
				await new Promise<void>((resolve, reject) => {
					silentServer.once('error', reject).listen(0, '127.0.0.1', resolve);
				});
				const address = silentServer.address();
				if (address == null || typeof address === 'string') throw new Error('Expected a TCP test address.');
				const configPath = join(tempDir, 'config.yml');
				await writeFile(configPath, JSON.stringify({
					url: meiliConfig.url, port: meiliConfig.port, id: meiliConfig.id,
					db: { ...meiliConfig.db, port: 1 }, redis: { host: '127.0.0.1', port: address.port },
					fulltextSearch: { provider: 'meilisearch' }, meilisearch: meiliConfig.meilisearch,
				}));

				await expect(promisify(execFile)(process.execPath, ['./built/cli.js', 'meilisearch-reindex'], {
					env: { ...process.env, MISSKEY_CONFIG_YML: configPath },
					timeout: 12_000,
				})).rejects.toMatchObject({ code: 1, killed: false });
				expect(acceptedConnection).toBe(true);
			} finally {
				for (const socket of sockets) socket.destroy();
				silentServer.close();
				await rm(tempDir, { recursive: true, force: true });
			}
		});

		defineSearchNoteTests(() => ctx, { supportsFollowersVisibility: false, sinceIdOrder: 'desc' });
	});
});
