/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { afterAll, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { DriveFilesRepository, DriveFoldersRepository, UsersRepository } from '@/models/_.js';
import { GlobalModule } from '@/GlobalModule.js';
import { CoreModule } from '@/core/CoreModule.js';
import { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { DriveFolderEntityService } from '@/core/entities/DriveFolderEntityService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { genAidx } from '@/misc/id/aidx.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';

const describeBenchmark = process.env.RUN_BENCHMARKS === '1' ? describe : describe.skip;

describe('DriveFileEntityService', () => {
	let app: TestingModule;
	let service: DriveFileEntityService;
	let driveFolderEntityService: DriveFolderEntityService;
	let driveFilesRepository: DriveFilesRepository;
	let driveFoldersRepository: DriveFoldersRepository;
	let usersRepository: UsersRepository;
	let idCounter = 0;

	const userEntityServiceMock = {
		packMany: jest.fn(async (users: Array<string | { id: string }>) => {
			return users.map(u => ({
				id: typeof u === 'string' ? u : u.id,
				username: 'user',
			}));
		}),
		pack: jest.fn(async (user: string | { id: string }) => {
			return {
				id: typeof user === 'string' ? user : user.id,
				username: 'user',
			};
		}),
	};

	const nextId = () => genAidx(Date.now() + (idCounter++));

	const createUser = async () => {
		const un = secureRndstr(16);
		const id = nextId();
		await usersRepository.insert({
			id,
			username: un,
			usernameLower: un.toLowerCase(),
		});
		return usersRepository.findOneByOrFail({ id });
	};

	const createFolder = async (name: string, parentId: string | null) => {
		const id = nextId();
		await driveFoldersRepository.insert({
			id,
			name,
			userId: null,
			parentId,
		});
		return driveFoldersRepository.findOneByOrFail({ id });
	};

	const createFile = async (folderId: string | null, userId: string | null) => {
		const id = nextId();
		await driveFilesRepository.insert({
			id,
			userId,
			userHost: null,
			md5: secureRndstr(32),
			name: `file-${id}`,
			type: 'text/plain',
			size: 1,
			comment: null,
			blurhash: null,
			properties: {},
			storedInternal: true,
			url: `https://example.com/${id}`,
			thumbnailUrl: null,
			webpublicUrl: null,
			webpublicType: null,
			accessKey: null,
			thumbnailAccessKey: null,
			webpublicAccessKey: null,
			uri: null,
			src: null,
			folderId,
			isSensitive: false,
			maybeSensitive: false,
			maybePorn: false,
			isLink: false,
			requestHeaders: null,
			requestIp: null,
		});
		return driveFilesRepository.findOneByOrFail({ id });
	};

	beforeAll(async () => {
		const moduleBuilder = Test.createTestingModule({
			imports: [GlobalModule, CoreModule],
		});
		moduleBuilder.overrideProvider(UserEntityService).useValue(userEntityServiceMock as any);

		app = await moduleBuilder.compile();
		await app.init();
		app.enableShutdownHooks();

		service = app.get<DriveFileEntityService>(DriveFileEntityService);
		driveFolderEntityService = app.get<DriveFolderEntityService>(DriveFolderEntityService);
		driveFilesRepository = app.get<DriveFilesRepository>(DI.driveFilesRepository);
		driveFoldersRepository = app.get<DriveFoldersRepository>(DI.driveFoldersRepository);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
	});

	beforeEach(() => {
		userEntityServiceMock.packMany.mockClear();
		userEntityServiceMock.pack.mockClear();
	});

	afterAll(async () => {
		await app.close();
	});

	describe('pack', () => {
		test('detail: false', async () => {
			const user = await createUser();
			const folder = await createFolder('pack-root', null);
			const file = await createFile(folder.id, user.id);

			const packed = await service.pack(file, { detail: false, self: true }) as any;
			expect(packed.id).toBe(file.id);
			expect(packed.folder).toBeNull();
			expect(packed.user).toBeNull();
			expect(packed.userId).toBeNull();
		});

		test('detail: true', async () => {
			const folder = await createFolder('pack-parent', null);
			const child = await createFolder('pack-child', folder.id);
			const file = await createFile(child.id, null);

			const packed = await service.pack(file, { detail: true, self: true }) as any;
			expect(packed.folder?.id).toBe(child.id);
			expect(packed.folder?.parent?.id).toBe(folder.id);
		});
	});

	describe('packNullable', () => {
		test('returns null for missing', async () => {
			const packed = await service.packNullable('non-existent' as any, { detail: false });
			expect(packed).toBeNull();
		});

		test('uses packedUser hint when withUser', async () => {
			const user = await createUser();
			const file = await createFile(null, user.id);

			const packed = await service.packNullable(file, { withUser: true, self: true }, {
				packedUser: { id: user.id, username: 'hint' } as any,
			});
			expect(packed?.user?.id).toBe(user.id);
			expect(packed?.user?.username).toBe('hint');
		});
	});

	describe('packMany', () => {
		test('withUser: true uses deduped packMany', async () => {
			const user = await createUser();
			const fileA = await createFile(null, user.id);
			const fileB = await createFile(null, user.id);

			const packed = await service.packMany([fileA, fileB], { withUser: true, self: true });
			expect(packed.length).toBe(2);
			expect(userEntityServiceMock.packMany).toHaveBeenCalledTimes(1);
			expect(userEntityServiceMock.packMany.mock.calls[0]?.[0]?.length).toBe(1);
			expect(packed[0]?.user?.id).toBe(user.id);
		});

		test('detail: true packs folder', async () => {
			const folder = await createFolder('packmany-root', null);
			const file = await createFile(folder.id, null);

			const packed = await service.packMany([file], { detail: true, self: true });
			expect(packed[0]?.folder?.id).toBe(folder.id);
			expect(packed[0]?.folder?.parent).toBeUndefined();
		});

		test('detail: true uses DriveFolderEntityService pack', async () => {
			const folder = await createFolder('packmany-folder', null);
			const file = await createFile(folder.id, null);
			const packSpy = jest.spyOn(driveFolderEntityService, 'pack');

			await service.packMany([file], { detail: true, self: true });
			expect(packSpy).toHaveBeenCalled();
			packSpy.mockRestore();
		});
	});

	describeBenchmark('benchmark', () => {
		test('packMany', async () => {
			const user = await createUser();
			const folders = [];
			for (let i = 0; i < 100; i++) {
				folders.push(await createFolder(`bench-${i}`, null));
			}
			const files = [];
			for (const folder of folders) {
				for (let j = 0; j < 20; j++) {
					files.push(await createFile(folder.id, user.id));
				}
			}

			const start = Date.now();
			await service.packMany(files, { detail: true, withUser: true, self: true });
			const elapsed = Date.now() - start;

			console.log(`DriveFileEntityService.packMany benchmark: ${elapsed}ms`);
		});
	});
});
