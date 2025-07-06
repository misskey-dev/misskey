/* eslint-disable @typescript-eslint/no-unused-vars */
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test, TestingModule } from '@nestjs/testing';
import { FlashService } from '@/core/FlashService.js';
import { IdService } from '@/core/IdService.js';
import { FlashLikesRepository, FlashsRepository, MiFlash, MiUser, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';

describe('FlashService', () => {
	let app: TestingModule;
	let service: FlashService;

	// --------------------------------------------------------------------------------------

	let flashsRepository: FlashsRepository;
	let flashLikesRepository: FlashLikesRepository;
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
				CoreModule,
			],
			providers: [
				FlashService,
				IdService,
			],
		}).compile();

		service = app.get(FlashService);

		flashsRepository = app.get(DI.flashsRepository);
		flashLikesRepository = app.get(DI.flashLikesRepository);
		usersRepository = app.get(DI.usersRepository);
		userProfilesRepository = app.get(DI.userProfilesRepository);
		idService = app.get(IdService);

		root = await createUser({ username: 'root', usernameLower: 'root' });
		alice = await createUser({ username: 'alice', usernameLower: 'alice' });
		bob = await createUser({ username: 'bob', usernameLower: 'bob' });
	});

	afterEach(async () => {
		await usersRepository.createQueryBuilder().delete().execute();
		await userProfilesRepository.createQueryBuilder().delete().execute();
		await flashsRepository.createQueryBuilder().delete().execute();
		await flashLikesRepository.createQueryBuilder().delete().execute();
	});

	afterAll(async () => {
		await app.close();
	});

	// --------------------------------------------------------------------------------------

	describe('featured', () => {
		test('should return featured flashes', async () => {
			const flash1 = await createFlash({ likedCount: 1 });
			const flash2 = await createFlash({ likedCount: 2 });
			const flash3 = await createFlash({ likedCount: 3 });

			const result = await service.featured({
				offset: 0,
				limit: 10,
			});

			expect(result).toEqual([flash3, flash2, flash1]);
		});

		test('should return featured flashes public visibility only', async () => {
			const flash1 = await createFlash({ likedCount: 1, visibility: 'public' });
			const flash2 = await createFlash({ likedCount: 2, visibility: 'public' });
			const flash3 = await createFlash({ likedCount: 3, visibility: 'private' });

			const result = await service.featured({
				offset: 0,
				limit: 10,
			});

			expect(result).toEqual([flash2, flash1]);
		});

		test('should return featured flashes with offset', async () => {
			const flash1 = await createFlash({ likedCount: 1 });
			const flash2 = await createFlash({ likedCount: 2 });
			const flash3 = await createFlash({ likedCount: 3 });

			const result = await service.featured({
				offset: 1,
				limit: 10,
			});

			expect(result).toEqual([flash2, flash1]);
		});

		test('should return featured flashes with limit', async () => {
			const flash1 = await createFlash({ likedCount: 1 });
			const flash2 = await createFlash({ likedCount: 2 });
			const flash3 = await createFlash({ likedCount: 3 });

			const result = await service.featured({
				offset: 0,
				limit: 2,
			});

			expect(result).toEqual([flash3, flash2]);
		});
	});
});
