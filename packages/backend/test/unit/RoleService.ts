process.env.NODE_ENV = 'test';

import rndstr from 'rndstr';
import { addSingletonCtor, addSingletonInstance, buildServiceProvider, getRequiredService, ServiceCollection, ServiceProvider } from 'yohira';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { RoleService } from '@/core/RoleService.js';
import type { Role, RolesRepository, RoleAssignmentsRepository, UsersRepository, User, MetasRepository } from '@/models/index.js';
import { MetaService } from '@/core/MetaService.js';
import { genAid } from '@/misc/id/aid.js';
import { UserCacheService } from '@/core/UserCacheService.js';
import { DI } from '@/di-symbols.js';
import { addGlobalServices, initializeGlobalServices } from '@/boot/GlobalModule.js';
import { addRepositoryServices } from '@/boot/RepositoryModule.js';
import { addCoreServices } from '@/boot/CoreModule.js';

describe('RoleService', () => {
	let serviceProvider: ServiceProvider;
	let roleService: RoleService;
	let usersRepository: UsersRepository;
	let rolesRepository: RolesRepository;
	let roleAssignmentsRepository: RoleAssignmentsRepository;
	let metaService: jest.Mocked<MetaService>;

	function createUser(data: Partial<User> = {}) {
		const un = rndstr('a-z0-9', 16);
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

	async function assign(roleId: Role['id'], userId: User['id']) {
		await roleAssignmentsRepository.insert({
			id: genAid(new Date()),
			createdAt: new Date(),
			roleId,
			userId,
		});
	}

	beforeEach(async () => {
		const services = new ServiceCollection();
		addGlobalServices(services);
		addRepositoryServices(services);
		addCoreServices(services);
		addSingletonCtor(services, DI.RoleService, RoleService);
		addSingletonCtor(services, DI.UserCacheService, UserCacheService);
		addSingletonInstance(services, DI.MetaService, { fetch: vi.fn() });

		serviceProvider = buildServiceProvider(services);

		await initializeGlobalServices(serviceProvider);

		roleService = getRequiredService<RoleService>(serviceProvider, DI.RoleService);
		usersRepository = getRequiredService<UsersRepository>(serviceProvider, DI.usersRepository);
		rolesRepository = getRequiredService<RolesRepository>(serviceProvider, DI.rolesRepository);
		roleAssignmentsRepository = getRequiredService<RoleAssignmentsRepository>(serviceProvider, DI.roleAssignmentsRepository);

		metaService = getRequiredService<MetaService>(serviceProvider, DI.MetaService) as jest.Mocked<MetaService>;
	});

	afterEach(async () => {
		await Promise.all([
			getRequiredService<MetasRepository>(serviceProvider, DI.metasRepository).delete({}),
			usersRepository.delete({}),
			rolesRepository.delete({}),
			roleAssignmentsRepository.delete({}),
		]);
		await serviceProvider.disposeAsync();
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
			await assign(role.id, user.id);
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
			await assign(role1.id, user.id);
			await assign(role2.id, user.id);
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
	});
});
