/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, afterEach, beforeAll, describe, expect, test } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { SearchService } from '@/core/SearchService.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import {
	type ChannelsRepository,
	type FollowingsRepository,
	type NotesRepository,
	type UserProfilesRepository,
	type UsersRepository,
	type MiChannel,
	type MiNote,
	type MiUser,
} from '@/models/_.js';

describe('SearchService', () => {
	let app: TestingModule;
	let service: SearchService;
	let idService: IdService;

	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let notesRepository: NotesRepository;
	let channelsRepository: ChannelsRepository;
	let followingsRepository: FollowingsRepository;

	async function createUser(data: Partial<MiUser> = {}) {
		const id = idService.gen();
		const username = data.username ?? `user_${id}`;
		const usernameLower = data.usernameLower ?? username.toLowerCase();

		const user = await usersRepository
			.insert({
				id,
				username,
				usernameLower,
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.insert({
			userId: id,
		});

		return user;
	}

	async function createChannel(user: MiUser, data: Partial<MiChannel> = {}) {
		const id = idService.gen();
		const channel = await channelsRepository
			.insert({
				id,
				userId: user.id,
				name: data.name ?? `channel_${id}`,
				...data,
			})
			.then(x => channelsRepository.findOneByOrFail(x.identifiers[0]));

		return channel;
	}

	async function createNote(user: MiUser, data: Partial<MiNote> = {}, time?: number) {
		const id = time == null ? idService.gen() : idService.gen(time);
		const note = await notesRepository
			.insert({
				id,
				text: 'hello',
				userId: user.id,
				userHost: user.host,
				visibility: 'public',
				...data,
			})
			.then(x => notesRepository.findOneByOrFail(x.identifiers[0]));

		return note;
	}

	async function createFollowing(follower: MiUser, followee: MiUser) {
		await followingsRepository.insert({
			id: idService.gen(),
			followerId: follower.id,
			followeeId: followee.id,
			followerHost: follower.host,
			followeeHost: followee.host,
		});
	}

	beforeAll(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
				CoreModule,
			],
		}).compile();

		app.enableShutdownHooks();

		service = app.get(SearchService);
		idService = app.get(IdService);
		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);
		notesRepository = app.get(DI.notesRepository);
		channelsRepository = app.get(DI.channelsRepository);
		followingsRepository = app.get(DI.followingsRepository);
	});

	afterAll(async () => {
		await app.close();
	});

	afterEach(async () => {
		await notesRepository.createQueryBuilder().delete().execute();
		await followingsRepository.createQueryBuilder().delete().execute();
		await channelsRepository.createQueryBuilder().delete().execute();
		await userProfilesRepository.createQueryBuilder().delete().execute();
		await usersRepository.createQueryBuilder().delete().execute();
	});

	describe('searchNote', () => {
		test('filters notes by visibility (followers only visible to followers)', async () => {
			const me = await createUser({ username: 'me', usernameLower: 'me', host: null });
			const author = await createUser({ username: 'author', usernameLower: 'author', host: null });

			const publicNote = await createNote(author, { text: 'hello public', visibility: 'public' });
			const followersNote = await createNote(author, { text: 'hello followers', visibility: 'followers' });

			const beforeFollow = await service.searchNote('hello', me, {}, { limit: 10 });
			expect(beforeFollow.map(note => note.id)).toEqual([publicNote.id]);

			await createFollowing(me, author);

			const afterFollow = await service.searchNote('hello', me, {}, { limit: 10 });
			expect(afterFollow.map(note => note.id).sort()).toEqual([followersNote.id, publicNote.id].sort());
		});

		test('filters out suspended users via base note filtering', async () => {
			const me = await createUser({ username: 'me', usernameLower: 'me', host: null });
			const active = await createUser({ username: 'active', usernameLower: 'active', host: null });
			const suspended = await createUser({ username: 'suspended', usernameLower: 'suspended', host: null, isSuspended: true });

			const activeNote = await createNote(active, { text: 'hello active', visibility: 'public' });
			await createNote(suspended, { text: 'hello suspended', visibility: 'public' });

			const result = await service.searchNote('hello', me, {}, { limit: 10 });
			expect(result.map(note => note.id)).toEqual([activeNote.id]);
		});

		test('filters by userId', async () => {
			const me = await createUser({ username: 'me', usernameLower: 'me', host: null });
			const alice = await createUser({ username: 'alice', usernameLower: 'alice', host: null });
			const bob = await createUser({ username: 'bob', usernameLower: 'bob', host: null });

			const aliceNote = await createNote(alice, { text: 'hello alice', visibility: 'public' });
			await createNote(bob, { text: 'hello bob', visibility: 'public' });

			const result = await service.searchNote('hello', me, { userId: alice.id }, { limit: 10 });
			expect(result.map(note => note.id)).toEqual([aliceNote.id]);
		});

		test('filters by channelId', async () => {
			const me = await createUser({ username: 'me', usernameLower: 'me', host: null });
			const author = await createUser({ username: 'author', usernameLower: 'author', host: null });
			const channelA = await createChannel(author, { name: 'channel-a' });
			const channelB = await createChannel(author, { name: 'channel-b' });

			const channelNote = await createNote(author, { text: 'hello channel', channelId: channelA.id, visibility: 'public' });
			await createNote(author, { text: 'hello other', channelId: channelB.id, visibility: 'public' });

			const result = await service.searchNote('hello', me, { channelId: channelA.id }, { limit: 10 });
			expect(result.map(note => note.id)).toEqual([channelNote.id]);
		});

		test('filters by host', async () => {
			const me = await createUser({ username: 'me', usernameLower: 'me', host: null });
			const local = await createUser({ username: 'local', usernameLower: 'local', host: null });
			const remote = await createUser({ username: 'remote', usernameLower: 'remote', host: 'example.com' });

			const localNote = await createNote(local, { text: 'hello local', visibility: 'public' });
			const remoteNote = await createNote(remote, { text: 'hello remote', visibility: 'public', userHost: 'example.com' });

			const localResult = await service.searchNote('hello', me, { host: '.' }, { limit: 10 });
			expect(localResult.map(note => note.id)).toEqual([localNote.id]);

			const remoteResult = await service.searchNote('hello', me, { host: 'example.com' }, { limit: 10 });
			expect(remoteResult.map(note => note.id)).toEqual([remoteNote.id]);
		});

		describe('pagination', () => {
			test('paginates with sinceId (ASC order)', async () => {
				const me = await createUser({ username: 'me', usernameLower: 'me', host: null });
				const author = await createUser({ username: 'author', usernameLower: 'author', host: null });

				const t1 = Date.now() - 3000;
				const t2 = Date.now() - 2000;
				const t3 = Date.now() - 1000;

				const note1 = await createNote(author, { text: 'hello' }, t1);
				const note2 = await createNote(author, { text: 'hello' }, t2);
				const note3 = await createNote(author, { text: 'hello' }, t3);

				const result = await service.searchNote('hello', me, {}, { limit: 10, sinceId: note1.id });

				expect(result.map(note => note.id)).toEqual([note2.id, note3.id]);
			});

			test('paginates with untilId (DESC order)', async () => {
				const me = await createUser({ username: 'me', usernameLower: 'me', host: null });
				const author = await createUser({ username: 'author', usernameLower: 'author', host: null });

				const t1 = Date.now() - 3000;
				const t2 = Date.now() - 2000;
				const t3 = Date.now() - 1000;

				const note1 = await createNote(author, { text: 'hello' }, t1);
				const note2 = await createNote(author, { text: 'hello' }, t2);
				const note3 = await createNote(author, { text: 'hello' }, t3);

				const result = await service.searchNote('hello', me, {}, { limit: 10, untilId: note3.id });

				expect(result.map(note => note.id)).toEqual([note2.id, note1.id]);
			});

			test('paginates with sinceId and untilId together', async () => {
				const me = await createUser({ username: 'me', usernameLower: 'me', host: null });
				const author = await createUser({ username: 'author', usernameLower: 'author', host: null });

				const t1 = Date.now() - 4000;
				const t2 = Date.now() - 3000;
				const t3 = Date.now() - 2000;
				const t4 = Date.now() - 1000;

				const note1 = await createNote(author, { text: 'hello' }, t1);
				const note2 = await createNote(author, { text: 'hello' }, t2);
				const note3 = await createNote(author, { text: 'hello' }, t3);
				const note4 = await createNote(author, { text: 'hello' }, t4);

				const result = await service.searchNote('hello', me, {}, { limit: 10, sinceId: note1.id, untilId: note4.id });

				expect(result.map(note => note.id)).toEqual([note3.id, note2.id]);
			});
		});
	});
});
