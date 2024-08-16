/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FlashService } from '@/core/FlashService.js';
import { IdService } from '@/core/IdService.js';
import { FlashsRepository, MiFlash, MiUser, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { GlobalModule } from '@/GlobalModule.js';

describe('FlashService', () => {
	let app: TestingModule;
	let service: FlashService;

	// --------------------------------------------------------------------------------------

	let flashsRepository: FlashsRepository;
	let usersRepository: UsersRepository;
	let userProfilesRepository: UserProfilesRepository;
	let idService: IdService;

	// --------------------------------------------------------------------------------------

	let root: MiUser;
	let alice: MiUser;
	let bob: MiUser;

	// --------------------------------------------------------------------------------------

	async function createFlash(data: Partial<MiFlash>) {
		return flashsRepository.insert({
			id: idService.gen(),
			updatedAt: new Date(),
			userId: root.id,
			title: 'title',
			summary: 'summary',
			script: 'script',
			permissions: [],
			likedCount: 0,
			...data,
		}).then(x => flashsRepository.findOneByOrFail(x.identifiers[0]));
	}

	async function createUser(data: Partial<MiUser> = {}) {
		const user = await usersRepository
			.insert({
				id: idService.gen(),
				...data,
			})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));

		await userProfilesRepository.insert({
			userId: user.id,
		});

		return user;
	}

	// --------------------------------------------------------------------------------------

	beforeEach(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				FlashService,
				IdService,
			],
		}).compile();

		service = app.get(FlashService);

		flashsRepository = app.get(DI.flashsRepository);
		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);
		idService = app.get(IdService);

		root = await createUser({ username: 'root', usernameLower: 'root', isRoot: true });
		alice = await createUser({ username: 'alice', usernameLower: 'alice', isRoot: false });
		bob = await createUser({ username: 'bob', usernameLower: 'bob', isRoot: false });
	});

	afterEach(async () => {
		await usersRepository.delete({});
		await userProfilesRepository.delete({});
		await flashsRepository.delete({});
	});

	afterAll(async () => {
		await app.close();
	});

	// --------------------------------------------------------------------------------------

	describe('search', () => {
		test('updatedAt', async () => {
			const [flash1, flash2, flash3, flash4, flash5] = await Promise.all([
				createFlash({ updatedAt: new Date('2021-01-01T00:00:00Z') }),
				createFlash({ updatedAt: new Date('2021-01-02T00:00:00Z') }),
				createFlash({ updatedAt: new Date('2021-01-03T00:00:00Z') }),
				createFlash({ updatedAt: new Date('2021-01-04T00:00:00Z') }),
				createFlash({ updatedAt: new Date('2021-01-05T00:00:00Z') }),
			]);

			const result = await service.search({
				query: {
					updatedAtFrom: '2021-01-02T00:00:00Z',
					updatedAtTo: '2021-01-04T00:00:00Z',
				},
			});

			// id desc
			expect(result.items).toEqual([flash4, flash3, flash2]);
		});

		test('titleKeyWords', async () => {
			const [flash1, flash2, flash3, flash4, flash5] = await Promise.all([
				createFlash({ title: 'title1 aaa bbb' }),
				createFlash({ title: 'title2 bbb ccc' }),
				createFlash({ title: 'title3' }),
				createFlash({ title: 'title4 ddd eee' }),
				createFlash({ title: 'title5 bbb ddd' }),
			]);

			const result1 = await service.search({
				query: {
					titleKeyWords: ['aaa', 'eee'],
				},
			});

			// id desc
			expect(result1.items).toEqual([flash4, flash1]);

			const result2 = await service.search({
				query: {
					titleKeyWords: ['bbb'],
				},
			});

			// id desc
			expect(result2.items).toEqual([flash5, flash2, flash1]);
		});

		test('summaryKeyWords', async () => {
			const [flash1, flash2, flash3, flash4, flash5] = await Promise.all([
				createFlash({ summary: 'summary1 aaa bbb' }),
				createFlash({ summary: 'summary2 bbb ccc' }),
				createFlash({ summary: 'summary3' }),
				createFlash({ summary: 'summary4 ddd eee' }),
				createFlash({ summary: 'summary5 bbb ddd' }),
			]);

			const result1 = await service.search({
				query: {
					summaryKeyWords: ['aaa', 'eee'],
				},
			});

			// id desc
			expect(result1.items).toEqual([flash4, flash1]);

			const result2 = await service.search({
				query: {
					summaryKeyWords: ['bbb'],
				},
			});

			// id desc
			expect(result2.items).toEqual([flash5, flash2, flash1]);
		});

		test('userIds', async () => {
			const [flash1, flash2, flash3, flash4, flash5] = await Promise.all([
				createFlash({ userId: alice.id }),
				createFlash({ userId: bob.id }),
				createFlash({ userId: root.id }),
				createFlash({ userId: alice.id }),
				createFlash({ userId: bob.id }),
			]);

			const result1 = await service.search({
				query: {
					userIds: [alice.id, bob.id],
				},
			});

			// id desc
			expect(result1.items).toEqual([flash5, flash4, flash2, flash1]);

			const result2 = await service.search({
				query: {
					userIds: [alice.id],
				},
			});

			// id desc
			expect(result2.items).toEqual([flash4, flash1]);
		});

		test('likedCount', async () => {
			const [flash1, flash2, flash3, flash4, flash5] = await Promise.all([
				createFlash({ likedCount: 1 }),
				createFlash({ likedCount: 2 }),
				createFlash({ likedCount: 3 }),
				createFlash({ likedCount: 4 }),
				createFlash({ likedCount: 5 }),
			]);

			const result1 = await service.search({
				query: {
					likedCountMin: 2,
					likedCountMax: 4,
				},
			});

			// id desc
			expect(result1.items).toEqual([flash4, flash3, flash2]);
		});

		test('visibility', async () => {
			const [flash1, flash2, flash3, flash4, flash5] = await Promise.all([
				createFlash({ visibility: 'public' }),
				createFlash({ visibility: 'public' }),
				createFlash({ visibility: 'public' }),
				createFlash({ visibility: 'private' }),
				createFlash({ visibility: 'private' }),
			]);

			const result1 = await service.search({
				query: {
					visibility: 'public',
				},
			});

			// id desc
			expect(result1.items).toEqual([flash3, flash2, flash1]);
		});

		test('sinceId/untilId', async() => {
			const [flash1, flash2, flash3, flash4, flash5] = await Promise.all([
				createFlash({}),
				createFlash({}),
				createFlash({}),
				createFlash({}),
				createFlash({}),
			]);

			const result1 = await service.search({
				sinceId: flash2.id,
				untilId: flash4.id,
			});

			// id desc
			expect(result1.items).toEqual([flash3]);
		});

		test('title and likedCount', async () => {
			const [flash1, flash2, flash3, flash4, flash5] = await Promise.all([
				createFlash({ title: 'title1 aaa', likedCount: 1 }),
				createFlash({ title: 'title2 aaa', likedCount: 2 }),
				createFlash({ title: 'title3 aaa', likedCount: 3 }),
				createFlash({ title: 'title4 bbb', likedCount: 4 }),
				createFlash({ title: 'title5 bbb', likedCount: 5 }),
			]);

			const result1 = await service.search({
				query: {
					titleKeyWords: ['aaa'],
					likedCountMin: 2,
					likedCountMax: 4,
				},
			});

			// id desc
			expect(result1.items).toEqual([flash3, flash2]);
		});
	});
});
