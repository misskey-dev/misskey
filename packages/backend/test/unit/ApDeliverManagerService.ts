/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { MiLocalUser, MiRemoteUser } from '@/models/User.js';
import type { IActivity } from '@/core/activitypub/type.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { ApLoggerService } from '@/core/activitypub/ApLoggerService.js';
import { QueueService } from '@/core/QueueService.js';
import { FollowingsRepository, UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';

describe('ApDeliverManagerService', () => {
	let service: ApDeliverManagerService;
	let followingsRepository: jest.Mocked<FollowingsRepository>;
	let queueService: jest.Mocked<QueueService>;
	let apLoggerService: jest.Mocked<ApLoggerService>;

	const mockLocalUser: MiLocalUser = {
		id: 'local-user-id',
		host: null,
	} as MiLocalUser;

	const mockRemoteUser1: MiRemoteUser & { inbox: string; sharedInbox: string; } = {
		id: 'remote-user-1',
		host: 'remote.example.com',
		inbox: 'https://remote.example.com/inbox',
		sharedInbox: 'https://remote.example.com/shared-inbox',
	} as MiRemoteUser & { inbox: string; sharedInbox: string; };

	const mockRemoteUser2: MiRemoteUser & { inbox: string; } = {
		id: 'remote-user-2',
		host: 'another.example.com',
		inbox: 'https://another.example.com/inbox',
		sharedInbox: null,
	} as MiRemoteUser & { inbox: string; };

	const mockActivity: IActivity = {
		type: 'Create',
		id: 'activity-id',
		actor: 'https://local.example.com/users/local-user-id',
		object: {
			type: 'Note',
			id: 'note-id',
			content: 'Hello, world!',
		},
	};

	beforeAll(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				ApDeliverManagerService,
				{
					provide: ApDeliverManagerService.name,
					useExisting: ApDeliverManagerService,
				},
				{
					provide: DI.followingsRepository,
					useValue: {
						find: jest.fn(),
						createQueryBuilder: jest.fn(),
					},
				},
				{
					provide: QueueService,
					useValue: {
						deliverMany: jest.fn(),
					},
				},
				{
					provide: ApLoggerService,
					useValue: {
						logger: {
							createSubLogger: jest.fn().mockReturnValue({
								info: jest.fn(),
								warn: jest.fn(),
								error: jest.fn(),
							}),
						},
					},
				},
				{
					provide: UserKeypairService,
					useFactory: () => ({
						refreshAndPrepareEd25519KeyPair: jest.fn(),
					}),
				},
				{
					provide: AccountUpdateService.name,
					useFactory: () => ({
						publishToFollowers: jest.fn(),
					}),
				},
			],
		}).compile();

		service = module.get<ApDeliverManagerService>(ApDeliverManagerService);
		followingsRepository = module.get(DI.followingsRepository);
		queueService = module.get(QueueService);
		apLoggerService = module.get(ApLoggerService);

		await service.onModuleInit();
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('deliverToFollowers', () => {
		it('should deliver activity to all followers', async () => {
			const mockFollowings = [
				{
					followerSharedInbox: 'https://remote1.example.com/shared-inbox',
					followerInbox: 'https://remote1.example.com/inbox',
				},
				{
					followerSharedInbox: 'https://remote2.example.com/shared-inbox',
					followerInbox: 'https://remote2.example.com/inbox',
				},
				{
					followerSharedInbox: null,
					followerInbox: 'https://remote3.example.com/inbox',
				},
			];

			followingsRepository.find.mockResolvedValue(mockFollowings as any);

			await service.deliverToFollowers(mockLocalUser, mockActivity);

			expect(followingsRepository.find).toHaveBeenCalledWith({
				where: {
					followeeId: mockLocalUser.id,
					followerHost: expect.anything(), // Not(IsNull())
					isFollowerSuspended: false,
				},
				select: {
					followerSharedInbox: true,
					followerInbox: true,
				},
			});

			expect(queueService.deliverMany).toHaveBeenCalledWith(
				{ id: mockLocalUser.id },
				mockActivity,
				expect.any(Map),
				undefined,
			);

			// 呼び出されたinboxesを確認
			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(3);
			expect(inboxes.has('https://remote1.example.com/shared-inbox')).toBe(true);
			expect(inboxes.has('https://remote2.example.com/shared-inbox')).toBe(true);
			expect(inboxes.has('https://remote3.example.com/inbox')).toBe(true);
		});

		it('should exclude suspended followers by default', async () => {
			followingsRepository.find.mockResolvedValue([]);

			await service.deliverToFollowers(mockLocalUser, mockActivity);

			expect(followingsRepository.find).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						isFollowerSuspended: false,
					}),
				}),
			);
		});
	});

	describe('deliverToUser', () => {
		it('should deliver activity to specific remote user', async () => {
			await service.deliverToUser(mockLocalUser, mockActivity, mockRemoteUser1);

			expect(queueService.deliverMany).toHaveBeenCalledWith(
				{ id: mockLocalUser.id },
				mockActivity,
				expect.any(Map),
				undefined,
			);

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(1);
			expect(inboxes.has(mockRemoteUser1.inbox)).toBe(true);
		});

		it('should handle user without shared inbox', async () => {
			await service.deliverToUser(mockLocalUser, mockActivity, mockRemoteUser2);

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(1);
			expect(inboxes.has(mockRemoteUser2.inbox)).toBe(true);
		});

		it('should skip user with null inbox', async () => {
			const userWithoutInbox = {
				...mockRemoteUser1,
				inbox: null,
			} as MiRemoteUser;

			await service.deliverToUser(mockLocalUser, mockActivity, userWithoutInbox);

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(0);
		});
	});

	describe('deliverToUsers', () => {
		it('should deliver activity to multiple remote users', async () => {
			await service.deliverToUsers(mockLocalUser, mockActivity, [mockRemoteUser1, mockRemoteUser2]);

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(2);
			expect(inboxes.has(mockRemoteUser1.inbox)).toBe(true);
			expect(inboxes.has(mockRemoteUser2.inbox)).toBe(true);
		});
	});

	describe('createDeliverManager', () => {
		it('should create a DeliverManager instance', () => {
			const manager = service.createDeliverManager(mockLocalUser, mockActivity);

			expect(manager).toBeDefined();
			expect(typeof manager.addFollowersRecipe).toBe('function');
			expect(typeof manager.addDirectRecipe).toBe('function');
			expect(typeof manager.addAllKnowingSharedInboxRecipe).toBe('function');
			expect(typeof manager.execute).toBe('function');
		});

		it('should allow manual recipe management', async () => {
			const manager = service.createDeliverManager(mockLocalUser, mockActivity);

			followingsRepository.find.mockResolvedValue([
				{
					followerSharedInbox: null,
					followerInbox: 'https://follower.example.com/inbox',
				},
			] as any);

			// フォロワー配信のレシピを追加
			manager.addFollowersRecipe();
			// ダイレクト配信のレシピを追加
			manager.addDirectRecipe(mockRemoteUser1);

			await manager.execute();

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(2);
			expect(inboxes.has('https://follower.example.com/inbox')).toBe(true);
			expect(inboxes.has(mockRemoteUser1.inbox)).toBe(true);
		});

		it('should support ignoreSuspend option', async () => {
			const manager = service.createDeliverManager(mockLocalUser, mockActivity);

			followingsRepository.find.mockResolvedValue([]);

			manager.addFollowersRecipe();
			await manager.execute({ ignoreSuspend: true });

			expect(followingsRepository.find).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						isFollowerSuspended: undefined, // ignoreSuspend: true なので undefined
					}),
				}),
			);
		});

		it('followers and directs mixture: 先にfollowersでsharedInboxが追加されていた場合、directsでユーザーがそのsharedInboxを持っていたらinboxを追加しない', async () => {
			const manager = service.createDeliverManager(mockLocalUser, mockActivity);
			followingsRepository.find.mockResolvedValue([
				{
					followerSharedInbox: mockRemoteUser1.sharedInbox,
					followerInbox: mockRemoteUser2.inbox,
				},
			] as any);
			manager.addFollowersRecipe();
			manager.addDirectRecipe(mockRemoteUser1);
			await manager.execute();
			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(1);
			expect(inboxes.has(mockRemoteUser1.sharedInbox)).toBe(true);
			expect(inboxes.has(mockRemoteUser1.inbox)).toBe(false);
		});
	});

	describe('error handling', () => {
		it('should throw error for non-local actor', () => {
			const remoteActor = { id: 'remote-id', host: 'remote.example.com' } as any;

			expect(() => {
				service.createDeliverManager(remoteActor, mockActivity);
			}).toThrow('actor.host must be null');
		});

		it('should throw error when follower has null inbox', async () => {
			const mockFollowings = [
				{
					followerSharedInbox: null,
					followerInbox: null, // null inbox
				},
			];

			followingsRepository.find.mockResolvedValue(mockFollowings as any);

			await expect(service.deliverToFollowers(mockLocalUser, mockActivity)).rejects.toThrow('inbox is null');
		});
	});

	describe('AllKnowingSharedInbox recipe', () => {
		it('should collect all shared inboxes when using AllKnowingSharedInbox', async () => {
			const mockQueryBuilder = {
				select: jest.fn().mockReturnThis(),
				where: jest.fn().mockReturnThis(),
				orWhere: jest.fn().mockReturnThis(),
				distinct: jest.fn().mockReturnThis(),
				getRawMany: jest.fn<any>().mockResolvedValue([
					{ f_followerSharedInbox: 'https://shared1.example.com/inbox' },
					{ f_followeeSharedInbox: 'https://shared2.example.com/inbox' },
				]),
			};

			followingsRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

			const manager = service.createDeliverManager(mockLocalUser, mockActivity);
			manager.addAllKnowingSharedInboxRecipe();

			await manager.execute();

			expect(followingsRepository.createQueryBuilder).toHaveBeenCalledWith('f');
			expect(mockQueryBuilder.select).toHaveBeenCalledWith([
				'f.followerSharedInbox',
				'f.followeeSharedInbox',
			]);

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(2);
			expect(inboxes.has('https://shared1.example.com/inbox')).toBe(true);
			expect(inboxes.has('https://shared2.example.com/inbox')).toBe(true);
		});
	});
});

describe('ApDeliverManagerService (SQL)', () => {
	// followerにデータを挿入して、SQLの動作を確認します
	let app: TestingModule;
	let service: ApDeliverManagerService;
	let followingsRepository: FollowingsRepository;
	let usersRepository: UsersRepository;
	let queueService: jest.Mocked<QueueService>;

	async function createUser(data: Partial<{ id: string; username: string; host: string | null; inbox: string | null; sharedInbox: string | null; isSuspended: boolean }> = {}): Promise<any> {
		const user = {
			id: secureRndstr(16),
			username: secureRndstr(16),
			usernameLower: (data.username ?? secureRndstr(16)).toLowerCase(),
			host: data.host ?? null,
			inbox: data.inbox ?? null,
			sharedInbox: data.sharedInbox ?? null,
			isSuspended: data.isSuspended ?? false,
			...data,
		};

		await usersRepository.insert(user);
		return user;
	}

	async function createFollowing(follower: any, followee: any, data: Partial<{
		followerInbox: string | null;
		followerSharedInbox: string | null;
		followeeInbox: string | null;
		followeeSharedInbox: string | null;
		isFollowerSuspended: boolean;
	}> = {}): Promise<any> {
		const following = {
			id: secureRndstr(16),
			followerId: follower.id,
			followeeId: followee.id,
			followerHost: follower.host,
			followeeHost: followee.host,
			followerInbox: data.followerInbox ?? follower.inbox,
			followerSharedInbox: data.followerSharedInbox ?? follower.sharedInbox,
			followeeInbox: data.followeeInbox ?? null,
			followeeSharedInbox: data.followeeSharedInbox ?? null,
			isFollowerSuspended: data.isFollowerSuspended ?? false,
			isFollowerHibernated: false,
			withReplies: false,
			notify: null,
		};

		await followingsRepository.insert(following);
		return following;
	}

	beforeEach(async () => {
		const { Test } = await import('@nestjs/testing');
		const { GlobalModule } = await import('@/GlobalModule.js');
		const { DI } = await import('@/di-symbols.js');

		app = await Test.createTestingModule({
			imports: [GlobalModule],
			providers: [
				ApDeliverManagerService,
				{
					provide: ApDeliverManagerService.name,
					useExisting: ApDeliverManagerService,
				},
				{
					provide: QueueService,
					useFactory: () => ({
						deliverMany: jest.fn(),
					}),
				},
				{
					provide: ApLoggerService,
					useValue: {
						logger: {
							createSubLogger: jest.fn().mockReturnValue({
								info: jest.fn(),
								warn: jest.fn(),
								error: jest.fn(),
							}),
						},
					},
				},
				{
					provide: UserKeypairService,
					useFactory: () => ({
						refreshAndPrepareEd25519KeyPair: jest.fn(),
					}),
				},
				{
					provide: AccountUpdateService.name,
					useFactory: () => ({
						publishToFollowers: jest.fn(),
					}),
				},
			],
		}).compile();

		app.enableShutdownHooks();
		// Reset mocks
		jest.clearAllMocks();

		service = app.get<ApDeliverManagerService>(ApDeliverManagerService);
		followingsRepository = app.get<FollowingsRepository>(DI.followingsRepository);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		queueService = app.get<QueueService>(QueueService) as jest.Mocked<QueueService>;

		await service.onModuleInit();
	});

	afterEach(async () => {
		await app.close();
	});

	describe('deliverToFollowers with real data', () => {
		it('should deliver to followers excluding suspended ones', async () => {
			// Create local user (followee)
			const localUser = await createUser({
				host: null,
				username: 'localuser',
			});

			// Create remote followers
			const activeFollower = await createUser({
				host: 'active.example.com',
				username: 'activefollower',
				inbox: 'https://active.example.com/inbox',
				sharedInbox: 'https://active.example.com/shared-inbox',
				isSuspended: false,
			});

			const suspendedFollower = await createUser({
				host: 'suspended.example.com',
				username: 'suspendedfollower',
				inbox: 'https://suspended.example.com/inbox',
				sharedInbox: 'https://suspended.example.com/shared-inbox',
				isSuspended: true,
			});

			const followerWithoutSharedInbox = await createUser({
				host: 'noshared.example.com',
				username: 'noshared',
				inbox: 'https://noshared.example.com/inbox',
				sharedInbox: null,
				isSuspended: false,
			});

			// Create following relationships
			await createFollowing(activeFollower, localUser, {
				followerInbox: activeFollower.inbox,
				followerSharedInbox: activeFollower.sharedInbox,
				isFollowerSuspended: false,
			});

			await createFollowing(suspendedFollower, localUser, {
				followerInbox: suspendedFollower.inbox,
				followerSharedInbox: suspendedFollower.sharedInbox,
				isFollowerSuspended: true, // 凍結されたフォロワー
			});

			await createFollowing(followerWithoutSharedInbox, localUser, {
				followerInbox: followerWithoutSharedInbox.inbox,
				followerSharedInbox: null,
				isFollowerSuspended: false,
			});

			const mockActivity = {
				type: 'Create',
				id: 'test-activity',
				actor: `https://local.example.com/users/${localUser.id}`,
				object: { type: 'Note', content: 'Hello' },
			} as any;

			// Execute delivery
			await service.deliverToFollowers(localUser, mockActivity);

			// Verify delivery was queued
			expect(queueService.deliverMany).toHaveBeenCalledTimes(1);
			const [actor, activity, inboxes] = queueService.deliverMany.mock.calls[0];

			expect(actor.id).toBe(localUser.id);
			expect(activity).toBe(mockActivity);

			// Check inboxes - should include active followers but exclude suspended ones
			expect(inboxes.size).toBe(2);
			expect(inboxes.has('https://active.example.com/shared-inbox')).toBe(true);
			expect(inboxes.has('https://noshared.example.com/inbox')).toBe(true);
			expect(inboxes.has('https://suspended.example.com/shared-inbox')).toBe(false);
		});

		it('should include suspended followers when ignoreSuspend is true', async () => {
			const localUser = await createUser({ host: null });
			const suspendedFollower = await createUser({
				host: 'suspended.example.com',
				inbox: 'https://suspended.example.com/inbox',
				isSuspended: true,
			});

			await createFollowing(suspendedFollower, localUser, {
				isFollowerSuspended: true,
			});

			const manager = service.createDeliverManager(localUser, { type: 'Test' } as any);
			manager.addFollowersRecipe();

			// Execute with ignoreSuspend: true
			await manager.execute({ ignoreSuspend: true });

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(1);
			expect(inboxes.has('https://suspended.example.com/inbox')).toBe(true);
		});

		it('should handle mixed follower types correctly', async () => {
			const localUser = await createUser({ host: null });

			// フォロワー1: shared inbox あり
			const follower1 = await createUser({
				host: 'server1.example.com',
				inbox: 'https://server1.example.com/users/user1/inbox',
				sharedInbox: 'https://server1.example.com/inbox',
			});

			// フォロワー2: 同じサーバーの別ユーザー（shared inbox は同じ）
			const follower2 = await createUser({
				host: 'server1.example.com',
				inbox: 'https://server1.example.com/users/user2/inbox',
				sharedInbox: 'https://server1.example.com/inbox',
			});

			// フォロワー3: 別サーバー、shared inbox なし
			const follower3 = await createUser({
				host: 'server2.example.com',
				inbox: 'https://server2.example.com/users/user3/inbox',
				sharedInbox: null,
			});

			await createFollowing(follower1, localUser);
			await createFollowing(follower2, localUser);
			await createFollowing(follower3, localUser);

			await service.deliverToFollowers(localUser, { type: 'Test' } as any);

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];

			// shared inbox は重複排除されるので、2つのinboxのみ
			expect(inboxes.size).toBe(2);
			expect(inboxes.has('https://server1.example.com/inbox')).toBe(true); // shared inbox
			expect(inboxes.has('https://server2.example.com/users/user3/inbox')).toBe(true); // individual inbox

			// individual inbox は shared inbox があるので使用されない
			expect(inboxes.has('https://server1.example.com/users/user1/inbox')).toBe(false);
			expect(inboxes.has('https://server1.example.com/users/user2/inbox')).toBe(false);
		});
	});

	describe('AllKnowingSharedInbox with real data', () => {
		it('should collect all unique shared inboxes from database', async () => {
			// Create users with various inbox configurations
			const user1 = await createUser({ host: null });
			const user2 = await createUser({ host: null });

			const remoteUser1 = await createUser({
				host: 'server1.example.com',
				sharedInbox: 'https://server1.example.com/shared',
			});

			const remoteUser2 = await createUser({
				host: 'server2.example.com',
				sharedInbox: 'https://server2.example.com/shared',
			});

			const remoteUser3 = await createUser({
				host: 'server1.example.com', // 同じサーバー
				sharedInbox: 'https://server1.example.com/shared', // 同じ shared inbox
			});

			// Create following relationships
			await createFollowing(remoteUser1, user1, {
				followerSharedInbox: 'https://server1.example.com/shared',
			});

			await createFollowing(user1, remoteUser2, {
				followerSharedInbox: null,
				followeeSharedInbox: 'https://server2.example.com/shared',
			});

			await createFollowing(remoteUser3, user2, {
				followerSharedInbox: 'https://server1.example.com/shared', // 重複
			});

			const manager = service.createDeliverManager(user1, { type: 'Test' } as any);
			manager.addAllKnowingSharedInboxRecipe();

			await manager.execute();

			const [, , inboxes] = queueService.deliverMany.mock.calls[0];

			// 重複は除去されて2つのユニークな shared inbox
			expect(inboxes.size).toBe(2);
			expect(inboxes.has('https://server1.example.com/shared')).toBe(true);
			expect(inboxes.has('https://server2.example.com/shared')).toBe(true);
		});
	});
});

