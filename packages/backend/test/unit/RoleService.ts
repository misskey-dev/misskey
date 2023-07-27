/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import * as lolex from '@sinonjs/fake-timers';
import { GlobalModule } from '@/GlobalModule.js';
import { RoleService } from '@/core/RoleService.js';
import type { Role, RolesRepository, RoleAssignmentsRepository, UsersRepository, User } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { MetaService } from '@/core/MetaService.js';
import { genAid } from '@/misc/id/aid.js';
import { CacheService } from '@/core/CacheService.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { sleep } from '../utils.js';
import type { TestingModule } from '@nestjs/testing';
import type { MockFunctionMetadata } from 'jest-mock';

const moduleMocker = new ModuleMocker(global);

describe('RoleService', () => {
	let app: TestingModule;
	let roleService: RoleService;
	let usersRepository: UsersRepository;
	let rolesRepository: RolesRepository;
	let roleAssignmentsRepository: RoleAssignmentsRepository;
	let metaService: jest.Mocked<MetaService>;
	let clock: lolex.InstalledClock;

	function createUser(data: Partial<User> = {}) {
		const un = secureRndstr(16);
		return usersRepository.insert({
			id: genAid(new Date()),
			createdAt: new Date(),
			username: un,
			usernameLower: un,
			...data,
		})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));
	}

	function createRole(data: Partial<Role> = {}) {
		return rolesRepository.insert({
			id: genAid(new Date()),
			createdAt: new Date(),
			updatedAt: new Date(),
			lastUsedAt: new Date(),
			description: '',
			...data,
		})
			.then(x => rolesRepository.findOneByOrFail(x.identifiers[0]));
	}

	beforeEach(async () => {
		clock = lolex.install({
			now: new Date(),
			shouldClearNativeTimers: true,
		});

		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				RoleService,
				CacheService,
				IdService,
				GlobalEventService,
			],
		})
			.useMocker((token) => {
				if (token === MetaService) {
					return { fetch: jest.fn() };
				}
				if (typeof token === 'function') {
					const mockMetadata = moduleMocker.getMetadata(token) as MockFunctionMetadata<any, any>;
					const Mock = moduleMocker.generateFromMetadata(mockMetadata);
					return new Mock();
				}
			})
			.compile();

		app.enableShutdownHooks();

		roleService = app.get<RoleService>(RoleService);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		rolesRepository = app.get<RolesRepository>(DI.rolesRepository);
		roleAssignmentsRepository = app.get<RoleAssignmentsRepository>(DI.roleAssignmentsRepository);

		metaService = app.get<MetaService>(MetaService) as jest.Mocked<MetaService>;
	});

	afterEach(async () => {
		clock.uninstall();

		await Promise.all([
			app.get(DI.metasRepository).delete({}),
			usersRepository.delete({}),
			rolesRepository.delete({}),
			roleAssignmentsRepository.delete({}),
		]);

		await app.close();
	});

	describe('getUserPolicies', () => {
		test('instance default policies', async () => {
			const user = await createUser();
			metaService.fetch.mockResolvedValue({
				policies: {
					canManageCustomEmojis: false,
				},
			} as any);

			const result = await roleService.getUserPolicies(user.id);

			expect(result.canManageCustomEmojis).toBe(false);
		});

		test('instance default policies 2', async () => {
			const user = await createUser();
			metaService.fetch.mockResolvedValue({
				policies: {
					canManageCustomEmojis: true,
				},
			} as any);

			const result = await roleService.getUserPolicies(user.id);

			expect(result.canManageCustomEmojis).toBe(true);
		});

		test('with role', async () => {
			const user = await createUser();
			const role = await createRole({
				name: 'a',
				policies: {
					canManageCustomEmojis: {
						useDefault: false,
						priority: 0,
						value: true,
					},
				},
			});
			await roleService.assign(user.id, role.id);
			metaService.fetch.mockResolvedValue({
				policies: {
					canManageCustomEmojis: false,
				},
			} as any);

			const result = await roleService.getUserPolicies(user.id);

			expect(result.canManageCustomEmojis).toBe(true);
		});

		test('priority', async () => {
			const user = await createUser();
			const role1 = await createRole({
				name: 'role1',
				policies: {
					driveCapacityMb: {
						useDefault: false,
						priority: 0,
						value: 200,
					},
				},
			});
			const role2 = await createRole({
				name: 'role2',
				policies: {
					driveCapacityMb: {
						useDefault: false,
						priority: 1,
						value: 100,
					},
				},
			});
			await roleService.assign(user.id, role1.id);
			await roleService.assign(user.id, role2.id);
			metaService.fetch.mockResolvedValue({
				policies: {
					driveCapacityMb: 50,
				},
			} as any);

			const result = await roleService.getUserPolicies(user.id);

			expect(result.driveCapacityMb).toBe(100);
		});

		test('conditional role', async () => {
			const user1 = await createUser({
				createdAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * 365)),
			});
			const user2 = await createUser({
				createdAt: new Date(Date.now() - (1000 * 60 * 60 * 24 * 365)),
				followersCount: 10,
			});
			const role = await createRole({
				name: 'a',
				policies: {
					canManageCustomEmojis: {
						useDefault: false,
						priority: 0,
						value: true,
					},
				},
				target: 'conditional',
				condFormula: {
					type: 'and',
					values: [{
						type: 'followersMoreThanOrEq',
						value: 10,
					}, {
						type: 'createdMoreThan',
						sec: 60 * 60 * 24 * 7,
					}],
				},
			});

			metaService.fetch.mockResolvedValue({
				policies: {
					canManageCustomEmojis: false,
				},
			} as any);

			const user1Policies = await roleService.getUserPolicies(user1.id);
			const user2Policies = await roleService.getUserPolicies(user2.id);
			expect(user1Policies.canManageCustomEmojis).toBe(false);
			expect(user2Policies.canManageCustomEmojis).toBe(true);
		});

		test('expired role', async () => {
			const user = await createUser();
			const role = await createRole({
				name: 'a',
				policies: {
					canManageCustomEmojis: {
						useDefault: false,
						priority: 0,
						value: true,
					},
				},
			});
			await roleService.assign(user.id, role.id, new Date(Date.now() + (1000 * 60 * 60 * 24)));
			metaService.fetch.mockResolvedValue({
				policies: {
					canManageCustomEmojis: false,
				},
			} as any);

			const result = await roleService.getUserPolicies(user.id);
			expect(result.canManageCustomEmojis).toBe(true);

			clock.tick('25:00:00');

			const resultAfter25h = await roleService.getUserPolicies(user.id);
			expect(resultAfter25h.canManageCustomEmojis).toBe(false);

			await roleService.assign(user.id, role.id);

			// ストリーミング経由で反映されるまでちょっと待つ
			clock.uninstall();
			await sleep(100);

			const resultAfter25hAgain = await roleService.getUserPolicies(user.id);
			expect(resultAfter25hAgain.canManageCustomEmojis).toBe(true);
		});
	});
});
