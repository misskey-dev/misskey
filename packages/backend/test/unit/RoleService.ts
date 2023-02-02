process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { GlobalModule } from '@/GlobalModule.js';
import { RoleService } from '@/core/RoleService.js';
import type { Role, RolesRepository, RoleAssignmentsRepository, UsersRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { CoreModule } from '@/core/CoreModule.js';
import { MetaService } from '@/core/MetaService.js';
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

	function createUser() {
		return usersRepository.insert({
			id: 'a',
			createdAt: new Date(),
			username: 'a',
			usernameLower: 'a',
		})
			.then(x => usersRepository.findOneByOrFail(x.identifiers[0]));
	}

	function createRole(data: Partial<Role>) {
		return rolesRepository.insert({
			id: 'a',
			createdAt: new Date(),
			updatedAt: new Date(),
			lastUsedAt: new Date(),
			description: '',
			...data,
		})
			.then(x => rolesRepository.findOneByOrFail(x.identifiers[0]));
	}

	beforeEach(async () => {
		app = await Test.createTestingModule({
			imports: [
				GlobalModule,
			],
			providers: [
				RoleService,
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
		await Promise.all([
			app.get(DI.metasRepository).delete({}),
			usersRepository.delete({}),
			rolesRepository.delete({}),
			roleAssignmentsRepository.delete({}),
		]);
		await app.close();
	});

	describe('getUserPolicies', () => {
		it('instance default policies', async () => {	
			const user = await createUser();
			metaService.fetch.mockResolvedValue({
				policies: {
					canManageCustomEmojis: false,
				},
			});
	
			const result = await roleService.getUserPolicies(user.id);
	
			expect(result.canManageCustomEmojis).toBe(false);
		});
	
		it('instance default policies 2', async () => {	
			const user = await createUser();
			metaService.fetch.mockResolvedValue({
				policies: {
					canManageCustomEmojis: true,
				},
			});
	
			const result = await roleService.getUserPolicies(user.id);
	
			expect(result.canManageCustomEmojis).toBe(true);
		});
	
		it('with role', async () => {	
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
			await roleAssignmentsRepository.insert({
				id: 'a',
				createdAt: new Date(),
				roleId: role.id,
				userId: user.id,
			});
			metaService.fetch.mockResolvedValue({
				policies: {
					canManageCustomEmojis: false,
				},
			});
	
			const result = await roleService.getUserPolicies(user.id);
	
			expect(result.canManageCustomEmojis).toBe(true);
		});
	});
});
