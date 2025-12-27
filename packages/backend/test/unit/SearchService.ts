/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import type { Index, MeiliSearch } from 'meilisearch';
import { type Config, loadConfig } from '@/config.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { SearchService } from '@/core/SearchService.js';
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
		let meilisearch: MeiliSearch;
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
			meilisearch = ctx.app.get(DI.meilisearch) as MeiliSearch;
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

		defineSearchNoteTests(() => ctx, { supportsFollowersVisibility: false, sinceIdOrder: 'desc' });
	});
});
