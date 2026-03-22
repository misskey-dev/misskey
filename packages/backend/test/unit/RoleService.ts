/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { setTimeout } from 'node:timers/promises';
import { describe, jest } from '@jest/globals';
import { ModuleMocker } from 'jest-mock';
import { Test } from '@nestjs/testing';
import * as lolex from '@sinonjs/fake-timers';
import type { TestingModule } from '@nestjs/testing';
import type { MockMetadata } from 'jest-mock';
import { GlobalModule } from '@/GlobalModule.js';
import { RoleService } from '@/core/RoleService.js';
import {
	MiMeta,
	MiRole,
	MiRoleAssignment,
	MiUser,
	RoleAssignmentsRepository,
	RolesRepository,
	UsersRepository,
} from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { MetaService } from '@/core/MetaService.js';
import { genAidx } from '@/misc/id/aidx.js';
import { CacheService } from '@/core/CacheService.js';
import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { NotificationService } from '@/core/NotificationService.js';
import { RoleCondFormulaValue } from '@/models/Role.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

const moduleMocker = new ModuleMocker(global);

describe('RoleService', () => {
	let app: TestingModule;
	let roleService: RoleService;
	let usersRepository: UsersRepository;
	let rolesRepository: RolesRepository;
	let roleAssignmentsRepository: RoleAssignmentsRepository;
	let meta: jest.Mocked<MiMeta>;
	let notificationService: jest.Mocked<NotificationService>;
	let clock: lolex.InstalledClock;

	async function createUser(data: Partial<MiUser> = {}) {
		const un = secureRndstr(16);
		const x = await usersRepository.insert({
			id: genAidx(Date.now()),
			username: un,
			usernameLower: un,
			...data,
		});
		return await usersRepository.findOneByOrFail(x.identifiers[0]);
	}

	async function createRoot(data: Partial<MiUser> = {}) {
		const user = await createUser(data);
		meta.rootUserId = user.id;
		return user;
	}

	async function createRole(data: Partial<MiRole> = {}) {
		const x = await rolesRepository.insert({
			id: genAidx(Date.now()),
			updatedAt: new Date(),
			lastUsedAt: new Date(),
			name: '',
			description: '',
			...data,
		});
		return await rolesRepository.findOneByOrFail(x.identifiers[0]);
	}

	function createConditionalRole(condFormula: RoleCondFormulaValue, data: Partial<MiRole> = {}) {
		return createRole({
			name: `[conditional] ${condFormula.type}`,
			target: 'conditional',
			condFormula: condFormula,
			...data,
		});
	}

	async function assignRole(args: Partial<MiRoleAssignment>) {
		const id = genAidx(Date.now());
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 1);

		await roleAssignmentsRepository.insert({
			id,
			expiresAt,
			...args,
		});

		return await roleAssignmentsRepository.findOneByOrFail({ id });
	}

	function aidx() {
		return genAidx(Date.now());
	}

	beforeEach(async () => {
		clock = lolex.install({
			// https://github.com/sinonjs/sinon/issues/2620
			toFake: Object.keys(lolex.timers).filter((key) => !['nextTick', 'queueMicrotask'].includes(key)) as lolex.FakeMethod[],
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
				UserEntityService,
				{
					provide: NotificationService,
					useFactory: () => ({
						createNotification: jest.fn(),
					}),
				},
				{
					provide: NotificationService.name,
					useExisting: NotificationService,
				},
			],
		})
			.useMocker((token) => {
				if (token === MetaService) {
					return { fetch: jest.fn() };
				}
				if (typeof token === 'function') {
					const mockMetadata = moduleMocker.getMetadata(token) as MockMetadata<any, any>;
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

		meta = app.get<MiMeta>(DI.meta) as jest.Mocked<MiMeta>;
		notificationService = app.get<NotificationService>(NotificationService) as jest.Mocked<NotificationService>;

		await roleService.onModuleInit();
	});

	afterEach(async () => {
		clock.uninstall();

		/**
		 * Delete meta and roleAssignment first to avoid deadlock due to schema dependencies
		 * https://github.com/misskey-dev/misskey/issues/16783
		 */ 
		await app.get(DI.metasRepository).createQueryBuilder().delete().execute();
		await roleAssignmentsRepository.createQueryBuilder().delete().execute();
		await Promise.all([
			usersRepository.createQueryBuilder().delete().execute(),
			rolesRepository.createQueryBuilder().delete().execute(),
		]);

		await app.close();
	});

	describe('getUserAssigns', () => {
		test('アサインされたロールを取得できる', async () => {
			const user = await createUser();
			const role1 = await createRole({ name: 'a' });
			const role2 = await createRole({ name: 'b' });

			await roleService.assign(user.id, role1.id);
			await roleService.assign(user.id, role2.id);

			const assigns = await roleService.getUserAssigns(user.id);
			expect(assigns).toHaveLength(2);
			expect(assigns.some(a => a.roleId === role1.id)).toBe(true);
			expect(assigns.some(a => a.roleId === role2.id)).toBe(true);
		});

		test('アサインされたロールの有効/期限切れパターンを取得できる', async () => {
			const user = await createUser();
			const roleNoExpiry = await createRole({ name: 'no-expires' });
			const roleNotExpired = await createRole({ name: 'not-expired' });
			const roleExpired = await createRole({ name: 'expired' });

			// expiresAtなし
			await roleService.assign(user.id, roleNoExpiry.id);

			// expiresAtあり（期限切れでない）
			const future = new Date(Date.now() + 1000 * 60 * 60); // +1 hour
			await roleService.assign(user.id, roleNotExpired.id, future);

			// expiresAtあり（期限切れ）
			await assignRole({ userId: user.id, roleId: roleExpired.id, expiresAt: new Date(Date.now() - 1000) });

			const assigns = await roleService.getUserAssigns(user.id);
			expect(assigns.some(a => a.roleId === roleNoExpiry.id)).toBe(true);
			expect(assigns.some(a => a.roleId === roleNotExpired.id)).toBe(true);
			expect(assigns.some(a => a.roleId === roleExpired.id)).toBe(false);
		});
	});

	describe('getUserRoles', () => {
		test('アサインされたロールとコンディショナルロールの両方が取得できる', async () => {
			const user = await createUser();
			const manualRole = await createRole({ name: 'manual role' });
			const conditionalRole = await createConditionalRole({
				id: aidx(),
				type: 'isBot',
			});
			await roleService.assign(user.id, manualRole.id);
			await roleService.assign(user.id, conditionalRole.id);

			const roles = await roleService.getUserRoles(user.id);
			expect(roles.some(r => r.id === manualRole.id)).toBe(true);
			expect(roles.some(r => r.id === conditionalRole.id)).toBe(true);
		});
	});

	describe('getUserPolicies', () => {
		test('instance default policies', async () => {
			const user = await createUser();
			meta.policies = {
				canManageCustomEmojis: false,
			};

			const result = await roleService.getUserPolicies(user.id);

			expect(result.canManageCustomEmojis).toBe(false);
		});

		test('instance default policies 2', async () => {
			const user = await createUser();
			meta.policies = {
				canManageCustomEmojis: true,
			};

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
			meta.policies = {
				canManageCustomEmojis: false,
			};

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
			meta.policies = {
				driveCapacityMb: 50,
			};

			const result = await roleService.getUserPolicies(user.id);

			expect(result.driveCapacityMb).toBe(100);
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
			meta.policies = {
				canManageCustomEmojis: false,
			};

			const result = await roleService.getUserPolicies(user.id);
			expect(result.canManageCustomEmojis).toBe(true);

			clock.tick('25:00:00');

			const resultAfter25h = await roleService.getUserPolicies(user.id);
			expect(resultAfter25h.canManageCustomEmojis).toBe(false);

			await roleService.assign(user.id, role.id);

			// ストリーミング経由で反映されるまでちょっと待つ
			clock.uninstall();
			await setTimeout(100);

			const resultAfter25hAgain = await roleService.getUserPolicies(user.id);
			expect(resultAfter25hAgain.canManageCustomEmojis).toBe(true);
		});

		test('role with no policy set', async () => {
			const user = await createUser();
			const roleWithPolicy = await createRole({
				name: 'roleWithPolicy',
				policies: {
					pinLimit: {
						useDefault: false,
						priority: 0,
						value: 10,
					},
				},
			});
			const roleWithoutPolicy = await createRole({
				name: 'roleWithoutPolicy',
				policies: {}, // ポリシーが空
			});
			await roleService.assign(user.id, roleWithPolicy.id);
			await roleService.assign(user.id, roleWithoutPolicy.id);
			meta.policies = {
				pinLimit: 5,
			};

			const result = await roleService.getUserPolicies(user.id);

			// roleWithoutPolicy は default 値 (5) を使い、roleWithPolicy の 10 と比較して大きい方が採用される
			expect(result.pinLimit).toBe(10);
		});
	});

	describe('getUserBadgeRoles', () => {
		test('手動アサイン済みのバッジロールのみが返る', async () => {
			const user = await createUser();
			const badgeRole = await createRole({ name: 'badge', asBadge: true });
			const normalRole = await createRole({ name: 'normal', asBadge: false });

			await roleService.assign(user.id, badgeRole.id);
			await roleService.assign(user.id, normalRole.id);

			const roles = await roleService.getUserBadgeRoles(user.id);
			expect(roles.some(r => r.id === badgeRole.id)).toBe(true);
			expect(roles.some(r => r.id === normalRole.id)).toBe(false);
		});

		test('コンディショナルなバッジロールが条件一致で返る', async () => {
			const user = await createUser({ isBot: true });
			const condBadgeRole = await createConditionalRole({
				id: aidx(),
				type: 'isBot',
			}, { asBadge: true, name: 'cond-badge' });
			const condNonBadgeRole = await createConditionalRole({
				id: aidx(),
				type: 'isBot',
			}, { asBadge: false, name: 'cond-non-badge' });

			const roles = await roleService.getUserBadgeRoles(user.id);
			expect(roles.some(r => r.id === condBadgeRole.id)).toBe(true);
			expect(roles.some(r => r.id === condNonBadgeRole.id)).toBe(false);
		});

		test('roleAssignedTo 条件のバッジロール: アサイン有無で変化する', async () => {
			const [user1, user2] = await Promise.all([createUser(), createUser()]);
			const manualRole = await createRole({ name: 'manual' });
			const condBadgeRole = await createConditionalRole({
				id: aidx(),
				type: 'roleAssignedTo',
				roleId: manualRole.id,
			}, { asBadge: true, name: 'assigned-badge' });

			await roleService.assign(user2.id, manualRole.id);

			const [roles1, roles2] = await Promise.all([
				roleService.getUserBadgeRoles(user1.id),
				roleService.getUserBadgeRoles(user2.id),
			]);
			expect(roles1.some(r => r.id === condBadgeRole.id)).toBe(false);
			expect(roles2.some(r => r.id === condBadgeRole.id)).toBe(true);
		});

		test('期限切れのバッジロールは除外される', async () => {
			const user = await createUser();
			const roleNoExpiry = await createRole({ name: 'no-exp', asBadge: true });
			const roleNotExpired = await createRole({ name: 'not-expired', asBadge: true });
			const roleExpired = await createRole({ name: 'expired', asBadge: true });

			// expiresAt なし
			await roleService.assign(user.id, roleNoExpiry.id);

			// expiresAt あり（期限切れでない）
			const future = new Date(Date.now() + 1000 * 60 * 60); // +1 hour
			await roleService.assign(user.id, roleNotExpired.id, future);

			// expiresAt あり（期限切れ）
			await assignRole({ userId: user.id, roleId: roleExpired.id, expiresAt: new Date(Date.now() - 1000) });

			const rolesBefore = await roleService.getUserBadgeRoles(user.id);
			expect(rolesBefore.some(r => r.id === roleNoExpiry.id)).toBe(true);
			expect(rolesBefore.some(r => r.id === roleNotExpired.id)).toBe(true);
			expect(rolesBefore.some(r => r.id === roleExpired.id)).toBe(false);

			// 時間経過で roleNotExpired を失効させる
			clock.tick('02:00:00');
			const rolesAfter = await roleService.getUserBadgeRoles(user.id);
			expect(rolesAfter.some(r => r.id === roleNoExpiry.id)).toBe(true);
			expect(rolesAfter.some(r => r.id === roleNotExpired.id)).toBe(false);
		});
	});

	describe('getModeratorIds', () => {
		test('includeAdmins = false, includeRoot = false, excludeExpire = false', async () => {
			const [adminUser1, adminUser2, modeUser1, modeUser2, normalUser1, normalUser2, rootUser] = await Promise.all([
				createUser(), createUser(), createUser(), createUser(), createUser(), createUser(), createRoot(),
			]);

			const role1 = await createRole({ name: 'admin', isAdministrator: true });
			const role2 = await createRole({ name: 'moderator', isModerator: true });
			const role3 = await createRole({ name: 'normal' });

			await Promise.all([
				assignRole({ userId: adminUser1.id, roleId: role1.id }),
				assignRole({ userId: adminUser2.id, roleId: role1.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: modeUser1.id, roleId: role2.id }),
				assignRole({ userId: modeUser2.id, roleId: role2.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: normalUser1.id, roleId: role3.id }),
				assignRole({ userId: normalUser2.id, roleId: role3.id, expiresAt: new Date(Date.now() - 1000) }),
			]);

			const result = await roleService.getModeratorIds({
				includeAdmins: false,
				includeRoot: false,
				excludeExpire: false,
			});
			expect(result).toEqual([modeUser1.id, modeUser2.id]);
		});

		test('includeAdmins = false, includeRoot = false, excludeExpire = true', async () => {
			const [adminUser1, adminUser2, modeUser1, modeUser2, normalUser1, normalUser2, rootUser] = await Promise.all([
				createUser(), createUser(), createUser(), createUser(), createUser(), createUser(), createRoot(),
			]);

			const role1 = await createRole({ name: 'admin', isAdministrator: true });
			const role2 = await createRole({ name: 'moderator', isModerator: true });
			const role3 = await createRole({ name: 'normal' });

			await Promise.all([
				assignRole({ userId: adminUser1.id, roleId: role1.id }),
				assignRole({ userId: adminUser2.id, roleId: role1.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: modeUser1.id, roleId: role2.id }),
				assignRole({ userId: modeUser2.id, roleId: role2.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: normalUser1.id, roleId: role3.id }),
				assignRole({ userId: normalUser2.id, roleId: role3.id, expiresAt: new Date(Date.now() - 1000) }),
			]);

			const result = await roleService.getModeratorIds({
				includeAdmins: false,
				includeRoot: false,
				excludeExpire: true,
			});
			expect(result).toEqual([modeUser1.id]);
		});

		test('includeAdmins = true, includeRoot = false, excludeExpire = false', async () => {
			const [adminUser1, adminUser2, modeUser1, modeUser2, normalUser1, normalUser2, rootUser] = await Promise.all([
				createUser(), createUser(), createUser(), createUser(), createUser(), createUser(), createRoot(),
			]);

			const role1 = await createRole({ name: 'admin', isAdministrator: true });
			const role2 = await createRole({ name: 'moderator', isModerator: true });
			const role3 = await createRole({ name: 'normal' });

			await Promise.all([
				assignRole({ userId: adminUser1.id, roleId: role1.id }),
				assignRole({ userId: adminUser2.id, roleId: role1.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: modeUser1.id, roleId: role2.id }),
				assignRole({ userId: modeUser2.id, roleId: role2.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: normalUser1.id, roleId: role3.id }),
				assignRole({ userId: normalUser2.id, roleId: role3.id, expiresAt: new Date(Date.now() - 1000) }),
			]);

			const result = await roleService.getModeratorIds({
				includeAdmins: true,
				includeRoot: false,
				excludeExpire: false,
			});
			expect(result).toEqual([adminUser1.id, adminUser2.id, modeUser1.id, modeUser2.id]);
		});

		test('includeAdmins = true, includeRoot = false, excludeExpire = true', async () => {
			const [adminUser1, adminUser2, modeUser1, modeUser2, normalUser1, normalUser2, rootUser] = await Promise.all([
				createUser(), createUser(), createUser(), createUser(), createUser(), createUser(), createRoot(),
			]);

			const role1 = await createRole({ name: 'admin', isAdministrator: true });
			const role2 = await createRole({ name: 'moderator', isModerator: true });
			const role3 = await createRole({ name: 'normal' });

			await Promise.all([
				assignRole({ userId: adminUser1.id, roleId: role1.id }),
				assignRole({ userId: adminUser2.id, roleId: role1.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: modeUser1.id, roleId: role2.id }),
				assignRole({ userId: modeUser2.id, roleId: role2.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: normalUser1.id, roleId: role3.id }),
				assignRole({ userId: normalUser2.id, roleId: role3.id, expiresAt: new Date(Date.now() - 1000) }),
			]);

			const result = await roleService.getModeratorIds({
				includeAdmins: true,
				includeRoot: false,
				excludeExpire: true,
			});
			expect(result).toEqual([adminUser1.id, modeUser1.id]);
		});

		test('includeAdmins = false, includeRoot = true, excludeExpire = false', async () => {
			const [adminUser1, adminUser2, modeUser1, modeUser2, normalUser1, normalUser2, rootUser] = await Promise.all([
				createUser(), createUser(), createUser(), createUser(), createUser(), createUser(), createRoot(),
			]);

			const role1 = await createRole({ name: 'admin', isAdministrator: true });
			const role2 = await createRole({ name: 'moderator', isModerator: true });
			const role3 = await createRole({ name: 'normal' });

			await Promise.all([
				assignRole({ userId: adminUser1.id, roleId: role1.id }),
				assignRole({ userId: adminUser2.id, roleId: role1.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: modeUser1.id, roleId: role2.id }),
				assignRole({ userId: modeUser2.id, roleId: role2.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: normalUser1.id, roleId: role3.id }),
				assignRole({ userId: normalUser2.id, roleId: role3.id, expiresAt: new Date(Date.now() - 1000) }),
			]);

			const result = await roleService.getModeratorIds({
				includeAdmins: false,
				includeRoot: true,
				excludeExpire: false,
			});
			expect(result).toEqual([modeUser1.id, modeUser2.id, rootUser.id]);
		});

		test('includeAdmins = false, includeRoot = true, excludeExpire = true', async () => {
			const [adminUser1, adminUser2, modeUser1, modeUser2, normalUser1, normalUser2, rootUser] = await Promise.all([
				createUser(), createUser(), createUser(), createUser(), createUser(), createUser(), createRoot(),
			]);

			const role1 = await createRole({ name: 'admin', isAdministrator: true });
			const role2 = await createRole({ name: 'moderator', isModerator: true });
			const role3 = await createRole({ name: 'normal' });

			await Promise.all([
				assignRole({ userId: adminUser1.id, roleId: role1.id }),
				assignRole({ userId: adminUser2.id, roleId: role1.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: modeUser1.id, roleId: role2.id }),
				assignRole({ userId: modeUser2.id, roleId: role2.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: normalUser1.id, roleId: role3.id }),
				assignRole({ userId: normalUser2.id, roleId: role3.id, expiresAt: new Date(Date.now() - 1000) }),
			]);

			const result = await roleService.getModeratorIds({
				includeAdmins: false,
				includeRoot: true,
				excludeExpire: false,
			});
			expect(result).toEqual([modeUser1.id, modeUser2.id, rootUser.id]);
		});

		test('includeAdmins = true, includeRoot = true, excludeExpire = false', async () => {
			const [adminUser1, adminUser2, modeUser1, modeUser2, normalUser1, normalUser2, rootUser] = await Promise.all([
				createUser(), createUser(), createUser(), createUser(), createUser(), createUser(), createRoot(),
			]);

			const role1 = await createRole({ name: 'admin', isAdministrator: true });
			const role2 = await createRole({ name: 'moderator', isModerator: true });
			const role3 = await createRole({ name: 'normal' });

			await Promise.all([
				assignRole({ userId: adminUser1.id, roleId: role1.id }),
				assignRole({ userId: adminUser2.id, roleId: role1.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: modeUser1.id, roleId: role2.id }),
				assignRole({ userId: modeUser2.id, roleId: role2.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: normalUser1.id, roleId: role3.id }),
				assignRole({ userId: normalUser2.id, roleId: role3.id, expiresAt: new Date(Date.now() - 1000) }),
			]);

			const result = await roleService.getModeratorIds({
				includeAdmins: true,
				includeRoot: true,
				excludeExpire: false,
			});
			expect(result).toEqual([adminUser1.id, adminUser2.id, modeUser1.id, modeUser2.id, rootUser.id]);
		});

		test('includeAdmins = true, includeRoot = true, excludeExpire = true', async () => {
			const [adminUser1, adminUser2, modeUser1, modeUser2, normalUser1, normalUser2, rootUser] = await Promise.all([
				createUser(), createUser(), createUser(), createUser(), createUser(), createUser(), createRoot(),
			]);

			const role1 = await createRole({ name: 'admin', isAdministrator: true });
			const role2 = await createRole({ name: 'moderator', isModerator: true });
			const role3 = await createRole({ name: 'normal' });

			await Promise.all([
				assignRole({ userId: adminUser1.id, roleId: role1.id }),
				assignRole({ userId: adminUser2.id, roleId: role1.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: modeUser1.id, roleId: role2.id }),
				assignRole({ userId: modeUser2.id, roleId: role2.id, expiresAt: new Date(Date.now() - 1000) }),
				assignRole({ userId: normalUser1.id, roleId: role3.id }),
				assignRole({ userId: normalUser2.id, roleId: role3.id, expiresAt: new Date(Date.now() - 1000) }),
			]);

			const result = await roleService.getModeratorIds({
				includeAdmins: true,
				includeRoot: true,
				excludeExpire: true,
			});
			expect(result).toEqual([adminUser1.id, modeUser1.id, rootUser.id]);
		});
	});

	describe('getAdministratorIds', () => {
		test('should return only user IDs with administrator roles', async () => {
			const adminUser1 = await createUser();
			const adminUser2 = await createUser();
			const normalUser = await createUser();
			const moderatorUser = await createUser();

			const adminRole = await createRole({ name: 'admin', isAdministrator: true, isModerator: false });
			const moderatorRole = await createRole({ name: 'moderator', isModerator: true, isAdministrator: false });
			const normalRole = await createRole({ name: 'normal', isAdministrator: false, isModerator: false });

			await roleService.assign(adminUser1.id, adminRole.id);
			await roleService.assign(adminUser2.id, adminRole.id);
			await roleService.assign(moderatorUser.id, moderatorRole.id);
			await roleService.assign(normalUser.id, normalRole.id);

			const adminIds = await roleService.getAdministratorIds();

			// sort for deterministic order
			adminIds.sort();
			const expectedIds = [adminUser1.id, adminUser2.id].sort();

			expect(adminIds).toEqual(expectedIds);
		});

		test('should return an empty array if no users have administrator roles', async () => {
			const normalUser = await createUser();
			const normalRole = await createRole({ name: 'normal', isAdministrator: false });
			await roleService.assign(normalUser.id, normalRole.id);

			const adminIds = await roleService.getAdministratorIds();

			expect(adminIds).toHaveLength(0);
		});

		test('should return an empty array if there are no administrator roles defined', async () => {
			await createUser(); // create user to ensure not empty db
			const adminIds = await roleService.getAdministratorIds();
			expect(adminIds).toHaveLength(0);
		});

		// TODO: rootユーザーは現在実装に含まれていないため、テストもそれに倣う
		test('should not include the root user', async () => {
			const rootUser = await createUser();
			meta.rootUserId = rootUser.id;

			const adminIds = await roleService.getAdministratorIds();

			expect(adminIds).not.toContain(rootUser.id);
		});
	});

	describe('conditional role', () => {
		test('～かつ～', async () => {
			const [user1, user2, user3, user4] = await Promise.all([
				createUser({ isBot: true, isCat: false, isSuspended: false }),
				createUser({ isBot: false, isCat: true, isSuspended: false }),
				createUser({ isBot: true, isCat: true, isSuspended: false }),
				createUser({ isBot: false, isCat: false, isSuspended: true }),
			]);
			const role1 = await createConditionalRole({
				id: aidx(),
				type: 'isBot',
			});
			const role2 = await createConditionalRole({
				id: aidx(),
				type: 'isCat',
			});
			const role3 = await createConditionalRole({
				id: aidx(),
				type: 'isSuspended',
			});
			const role4 = await createConditionalRole({
				id: aidx(),
				type: 'and',
				values: [role1.condFormula, role2.condFormula],
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			const actual4 = await roleService.getUserRoles(user4.id);
			expect(actual1.some(r => r.id === role4.id)).toBe(false);
			expect(actual2.some(r => r.id === role4.id)).toBe(false);
			expect(actual3.some(r => r.id === role4.id)).toBe(true);
			expect(actual4.some(r => r.id === role4.id)).toBe(false);
		});

		test('～または～', async () => {
			const [user1, user2, user3, user4] = await Promise.all([
				createUser({ isBot: true, isCat: false, isSuspended: false }),
				createUser({ isBot: false, isCat: true, isSuspended: false }),
				createUser({ isBot: true, isCat: true, isSuspended: false }),
				createUser({ isBot: false, isCat: false, isSuspended: true }),
			]);
			const role1 = await createConditionalRole({
				id: aidx(),
				type: 'isBot',
			});
			const role2 = await createConditionalRole({
				id: aidx(),
				type: 'isCat',
			});
			const role3 = await createConditionalRole({
				id: aidx(),
				type: 'isSuspended',
			});
			const role4 = await createConditionalRole({
				id: aidx(),
				type: 'or',
				values: [role1.condFormula, role2.condFormula],
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			const actual4 = await roleService.getUserRoles(user4.id);
			expect(actual1.some(r => r.id === role4.id)).toBe(true);
			expect(actual2.some(r => r.id === role4.id)).toBe(true);
			expect(actual3.some(r => r.id === role4.id)).toBe(true);
			expect(actual4.some(r => r.id === role4.id)).toBe(false);
		});

		test('～ではない', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser({ isBot: true, isCat: false, isSuspended: false }),
				createUser({ isBot: false, isCat: true, isSuspended: false }),
				createUser({ isBot: true, isCat: true, isSuspended: false }),
			]);
			const role1 = await createConditionalRole({
				id: aidx(),
				type: 'isBot',
			});
			const role2 = await createConditionalRole({
				id: aidx(),
				type: 'isCat',
			});
			const role4 = await createConditionalRole({
				id: aidx(),
				type: 'not',
				value: role1.condFormula,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role4.id)).toBe(false);
			expect(actual2.some(r => r.id === role4.id)).toBe(true);
			expect(actual3.some(r => r.id === role4.id)).toBe(false);
		});

		test('マニュアルロールにアサイン済み', async () => {
			const [user1, user2, role1] = await Promise.all([
				createUser(),
				createUser(),
				createRole({
					name: 'manual role',
				}),
			]);
			const role2 = await createConditionalRole({
				id: aidx(),
				type: 'roleAssignedTo',
				roleId: role1.id,
			});
			await roleService.assign(user2.id, role1.id);

			const [u1role, u2role] = await Promise.all([
				roleService.getUserRoles(user1.id),
				roleService.getUserRoles(user2.id),
			]);
			expect(u1role.some(r => r.id === role2.id)).toBe(false);
			expect(u2role.some(r => r.id === role2.id)).toBe(true);
		});

		test('ローカルユーザのみ', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ host: null }),
				createUser({ host: 'example.com' }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'isLocal',
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			expect(actual1.some(r => r.id === role.id)).toBe(true);
			expect(actual2.some(r => r.id === role.id)).toBe(false);
		});

		test('リモートユーザのみ', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ host: null }),
				createUser({ host: 'example.com' }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'isRemote',
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
		});

		test('サスペンド済みユーザである', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ isSuspended: false }),
				createUser({ isSuspended: true }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'isSuspended',
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
		});

		test('鍵アカウントユーザである', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ isLocked: false }),
				createUser({ isLocked: true }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'isLocked',
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
		});

		test('botユーザである', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ isBot: false }),
				createUser({ isBot: true }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'isBot',
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
		});

		test('猫である', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ isCat: false }),
				createUser({ isCat: true }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'isCat',
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
		});

		test('「ユーザを見つけやすくする」が有効なアカウント', async () => {
			const [user1, user2] = await Promise.all([
				createUser({ isExplorable: false }),
				createUser({ isExplorable: true }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'isExplorable',
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
		});

		test('ユーザが作成されてから指定期間経過した', async () => {
			const base = new Date();
			base.setMinutes(base.getMinutes() - 5);

			const d1 = new Date(base);
			const d2 = new Date(base);
			const d3 = new Date(base);
			d1.setSeconds(d1.getSeconds() - 1);
			d3.setSeconds(d3.getSeconds() + 1);

			const [user1, user2, user3] = await Promise.all([
				// 4:59
				createUser({ id: genAidx(d1.getTime()) }),
				// 5:00
				createUser({ id: genAidx(d2.getTime()) }),
				// 5:01
				createUser({ id: genAidx(d3.getTime()) }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'createdLessThan',
				// 5 minutes
				sec: 300,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(false);
			expect(actual3.some(r => r.id === role.id)).toBe(true);
		});

		test('ユーザが作成されてから指定期間経っていない', async () => {
			const base = new Date();
			base.setMinutes(base.getMinutes() - 5);

			const d1 = new Date(base);
			const d2 = new Date(base);
			const d3 = new Date(base);
			d1.setSeconds(d1.getSeconds() - 1);
			d3.setSeconds(d3.getSeconds() + 1);

			const [user1, user2, user3] = await Promise.all([
				// 4:59
				createUser({ id: genAidx(d1.getTime()) }),
				// 5:00
				createUser({ id: genAidx(d2.getTime()) }),
				// 5:01
				createUser({ id: genAidx(d3.getTime()) }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'createdMoreThan',
				// 5 minutes
				sec: 300,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role.id)).toBe(true);
			expect(actual2.some(r => r.id === role.id)).toBe(false);
			expect(actual3.some(r => r.id === role.id)).toBe(false);
		});

		test('フォロワー数が指定値以下', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser({ followersCount: 99 }),
				createUser({ followersCount: 100 }),
				createUser({ followersCount: 101 }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'followersLessThanOrEq',
				value: 100,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role.id)).toBe(true);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
			expect(actual3.some(r => r.id === role.id)).toBe(false);
		});

		test('フォロワー数が指定値以下', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser({ followersCount: 99 }),
				createUser({ followersCount: 100 }),
				createUser({ followersCount: 101 }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'followersMoreThanOrEq',
				value: 100,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
			expect(actual3.some(r => r.id === role.id)).toBe(true);
		});

		test('フォロー数が指定値以下', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser({ followingCount: 99 }),
				createUser({ followingCount: 100 }),
				createUser({ followingCount: 101 }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'followingLessThanOrEq',
				value: 100,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role.id)).toBe(true);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
			expect(actual3.some(r => r.id === role.id)).toBe(false);
		});

		test('フォロー数が指定値以上', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser({ followingCount: 99 }),
				createUser({ followingCount: 100 }),
				createUser({ followingCount: 101 }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'followingMoreThanOrEq',
				value: 100,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
			expect(actual3.some(r => r.id === role.id)).toBe(true);
		});

		test('ノート数が指定値以下', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser({ notesCount: 9 }),
				createUser({ notesCount: 10 }),
				createUser({ notesCount: 11 }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'notesLessThanOrEq',
				value: 10,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role.id)).toBe(true);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
			expect(actual3.some(r => r.id === role.id)).toBe(false);
		});

		test('ノート数が指定値以上', async () => {
			const [user1, user2, user3] = await Promise.all([
				createUser({ notesCount: 9 }),
				createUser({ notesCount: 10 }),
				createUser({ notesCount: 11 }),
			]);
			const role = await createConditionalRole({
				id: aidx(),
				type: 'notesMoreThanOrEq',
				value: 10,
			});

			const actual1 = await roleService.getUserRoles(user1.id);
			const actual2 = await roleService.getUserRoles(user2.id);
			const actual3 = await roleService.getUserRoles(user3.id);
			expect(actual1.some(r => r.id === role.id)).toBe(false);
			expect(actual2.some(r => r.id === role.id)).toBe(true);
			expect(actual3.some(r => r.id === role.id)).toBe(true);
		});
	});

	describe('assign', () => {
		test('公開ロールの場合は通知される', async () => {
			const user = await createUser();
			const role = await createRole({
				isPublic: true,
				name: 'a',
			});

			await roleService.assign(user.id, role.id);

			clock.uninstall();
			await setTimeout(100);

			const assignments = await roleAssignmentsRepository.find({
				where: {
					userId: user.id,
					roleId: role.id,
				},
			});
			expect(assignments).toHaveLength(1);

			expect(notificationService.createNotification).toHaveBeenCalled();
			expect(notificationService.createNotification.mock.lastCall![0]).toBe(user.id);
			expect(notificationService.createNotification.mock.lastCall![1]).toBe('roleAssigned');
			expect(notificationService.createNotification.mock.lastCall![2]).toEqual({
				roleId: role.id,
			});
		});

		test('非公開ロールの場合は通知されない', async () => {
			const user = await createUser();
			const role = await createRole({
				isPublic: false,
				name: 'a',
			});

			await roleService.assign(user.id, role.id);

			clock.uninstall();
			await setTimeout(100);

			const assignments = await roleAssignmentsRepository.find({
				where: {
					userId: user.id,
					roleId: role.id,
				},
			});
			expect(assignments).toHaveLength(1);

			expect(notificationService.createNotification).not.toHaveBeenCalled();
		});
	});
});
