/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { describe, jest, test } from '@jest/globals';
import { In } from 'typeorm';
import { UserSearchService } from '@/core/UserSearchService.js';
import { FollowingsRepository, MiUser, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { IdService } from '@/core/IdService.js';
import { GlobalModule } from '@/GlobalModule.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

describe('UserSearchService', () => {
	let app: TestingModule;
	let service: UserSearchService;

	let usersRepository: UsersRepository;
	let followingsRepository: FollowingsRepository;
	let idService: IdService;
	let userProfilesRepository: UserProfilesRepository;

	let root: MiUser;
	let alice: MiUser;
	let alyce: MiUser;
	let alycia: MiUser;
	let alysha: MiUser;
	let alyson: MiUser;
	let alyssa: MiUser;
	let bob: MiUser;
	let bobbi: MiUser;
	let bobbie: MiUser;
	let bobby: MiUser;

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

	async function createFollowings(follower: MiUser, followees: MiUser[]) {
		for (const followee of followees) {
			await followingsRepository.insert({
				id: idService.gen(),
				followerId: follower.id,
				followeeId: followee.id,
			});
		}
	}

	async function setActive(users: MiUser[]) {
		for (const user of users) {
			await usersRepository.update(user.id, {
				updatedAt: new Date(),
			});
		}
	}

	async function setInactive(users: MiUser[]) {
		for (const user of users) {
			await usersRepository.update(user.id, {
				updatedAt: new Date(0),
			});
		}
	}

	async function setSuspended(users: MiUser[]) {
		for (const user of users) {
			await usersRepository.update(user.id, {
				isSuspended: true,
			});
		}
	}

	beforeAll(async () => {
		app = await Test
			.createTestingModule({
				imports: [
					GlobalModule,
				],
				providers: [
					UserSearchService,
					{
						provide: UserEntityService, useFactory: jest.fn(() => ({
							// とりあえずIDが返れば確認が出来るので
							packMany: (value: any) => value,
						})),
					},
					IdService,
				],
			})
			.compile();

		await app.init();

		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);
		followingsRepository = app.get(DI.followingsRepository);

		service = app.get(UserSearchService);
		idService = app.get(IdService);
	});

	beforeEach(async () => {
		root = await createUser({ username: 'root', usernameLower: 'root', isRoot: true });
		alice = await createUser({ username: 'Alice', usernameLower: 'alice' });
		alyce = await createUser({ username: 'Alyce', usernameLower: 'alyce' });
		alycia = await createUser({ username: 'Alycia', usernameLower: 'alycia' });
		alysha = await createUser({ username: 'Alysha', usernameLower: 'alysha' });
		alyson = await createUser({ username: 'Alyson', usernameLower: 'alyson', host: 'example.com' });
		alyssa = await createUser({ username: 'Alyssa', usernameLower: 'alyssa', host: 'example.com' });
		bob = await createUser({ username: 'Bob', usernameLower: 'bob' });
		bobbi = await createUser({ username: 'Bobbi', usernameLower: 'bobbi' });
		bobbie = await createUser({ username: 'Bobbie', usernameLower: 'bobbie', host: 'example.com' });
		bobby = await createUser({ username: 'Bobby', usernameLower: 'bobby', host: 'example.com' });
	});

	afterEach(async () => {
		await usersRepository.delete({});
	});

	afterAll(async () => {
		await app.close();
	});

	describe('search', () => {
		test('フォロー中のアクティブユーザのうち、"al"から始まる人が全員ヒットする', async () => {
			await createFollowings(root, [alice, alyce, alycia, alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);
			await setActive([alice, alyce, alyssa, bob, bobbi, bobbie, bobby]);
			await setInactive([alycia, alysha, alyson]);

			const result = await service.search(
				{ username: 'al' },
				{ limit: 100 },
				root,
			);

			// alycia, alysha, alysonは非アクティブなので後ろに行く
			expect(result).toEqual([alice, alyce, alyssa, alycia, alysha, alyson].map(x => x.id));
		});

		test('フォロー中の非アクティブユーザのうち、"al"から始まる人が全員ヒットする', async () => {
			await createFollowings(root, [alycia, alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);
			await setInactive([alice, alyce, alycia, alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);

			const result = await service.search(
				{ username: 'al' },
				{ limit: 100 },
				root,
			);

			// alice, alyceはフォローしていないので後ろに行く
			expect(result).toEqual([alycia, alysha, alyson, alyssa, alice, alyce].map(x => x.id));
		});

		test('フォローしていないアクティブユーザのうち、"al"から始まる人が全員ヒットする', async () => {
			await setActive([alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);
			await setInactive([alice, alyce, alycia]);

			const result = await service.search(
				{ username: 'al' },
				{ limit: 100 },
				root,
			);

			// alice, alyce, alyciaは非アクティブなので後ろに行く
			expect(result).toEqual([alysha, alyson, alyssa, alice, alyce, alycia].map(x => x.id));
		});

		test('フォローしていない非アクティブユーザのうち、"al"から始まる人が全員ヒットする', async () => {
			await setInactive([alice, alyce, alycia, alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);

			const result = await service.search(
				{ username: 'al' },
				{ limit: 100 },
				root,
			);

			expect(result).toEqual([alice, alyce, alycia, alysha, alyson, alyssa].map(x => x.id));
		});

		test('フォロー（アクティブ）、フォロー（非アクティブ）、非フォロー（アクティブ）、非フォロー（非アクティブ）混在時の優先順位度確認', async () => {
			await createFollowings(root, [alyson, alyssa, bob, bobbi, bobbie]);
			await setActive([root, alyssa, bob, bobbi, alyce, alycia]);
			await setInactive([alyson, alice, alysha, bobbie, bobby]);

			const result = await service.search(
				{ },
				{ limit: 100 },
				root,
			);

			// 見る用
			// const users = await usersRepository.findBy({ id: In(result) }).then(it => new Map(it.map(x => [x.id, x])));
			// console.log(result.map(x => users.get(x as any)).map(it => it?.username));

			// フォローしててアクティブなので先頭: alyssa, bob, bobbi
			// フォローしてて非アクティブなので次: alyson, bobbie
			// フォローしてないけどアクティブなので次: alyce, alycia, root(アルファベット順的にここになる)
			// フォローしてないし非アクティブなので最後: alice, alysha, bobby
			expect(result).toEqual([alyssa, bob, bobbi, alyson, bobbie, alyce, alycia, root, alice, alysha, bobby].map(x => x.id));
		});

		test('[非ログイン] アクティブユーザのうち、"al"から始まる人が全員ヒットする', async () => {
			await setActive([alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);
			await setInactive([alice, alyce, alycia]);

			const result = await service.search(
				{ username: 'al' },
				{ limit: 100 },
			);

			// alice, alyce, alyciaは非アクティブなので後ろに行く
			expect(result).toEqual([alysha, alyson, alyssa, alice, alyce, alycia].map(x => x.id));
		});

		test('[非ログイン] 非アクティブユーザのうち、"al"から始まる人が全員ヒットする', async () => {
			await setInactive([alice, alyce, alycia, alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);

			const result = await service.search(
				{ username: 'al' },
				{ limit: 100 },
			);

			expect(result).toEqual([alice, alyce, alycia, alysha, alyson, alyssa].map(x => x.id));
		});

		test('フォロー中のアクティブユーザのうち、"al"から始まり"example.com"にいる人が全員ヒットする', async () => {
			await createFollowings(root, [alice, alyce, alycia, alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);
			await setActive([alice, alyce, alycia, alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);

			const result = await service.search(
				{ username: 'al', host: 'exam' },
				{ limit: 100 },
				root,
			);

			expect(result).toEqual([alyson, alyssa].map(x => x.id));
		});

		test('サスペンド済みユーザは出ない', async () => {
			await setActive([alice, alyce, alycia, alysha, alyson, alyssa, bob, bobbi, bobbie, bobby]);
			await setSuspended([alice, alyce, alycia]);

			const result = await service.search(
				{ username: 'al' },
				{ limit: 100 },
				root,
			);

			expect(result).toEqual([alysha, alyson, alyssa].map(x => x.id));
		});
	});
});
