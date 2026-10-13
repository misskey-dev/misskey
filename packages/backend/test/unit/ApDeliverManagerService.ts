/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mocked } from 'vitest';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import type { MiLocalUser, MiRemoteUser } from '@/models/User.js';
import type { MiUserKeypair } from '@/models/UserKeypair.js';
import type { IActivity } from '@/core/activitypub/type.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { ApLoggerService } from '@/core/activitypub/ApLoggerService.js';
import { QueueService } from '@/core/QueueService.js';
import { UserKeypairService } from '@/core/UserKeypairService.js';
import { FollowingsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';

describe('ApDeliverManagerService', () => {
	let service: ApDeliverManagerService;
	let followingsRepository: Mocked<FollowingsRepository>;
	let queueService: Mocked<QueueService>;
	let userKeypairService: Mocked<UserKeypairService>;
	const accountUpdateService = { publishToFollowers: vi.fn() };

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
				{ provide: 'AccountUpdateService', useValue: accountUpdateService },
				ApDeliverManagerService,
				{
					provide: DI.followingsRepository,
					useValue: {
						find: vi.fn(),
						createQueryBuilder: vi.fn(),
					},
				},
				{
					provide: UserKeypairService,
					useValue: {
						refreshAndPrepareEd25519KeyPair: vi.fn(),
						getLocalUserPrivateKeyPem: vi.fn(),
					},
				},
				{
					provide: QueueService,
					useValue: {
						deliverMany: vi.fn(),
					},
				},
				{
					provide: ApLoggerService,
					useValue: {
						logger: {
							createSubLogger: vi.fn().mockReturnValue({
								info: vi.fn(),
								warn: vi.fn(),
								error: vi.fn(),
							}),
						},
					},
				},
			],
		}).compile();

		service = module.get<ApDeliverManagerService>(ApDeliverManagerService);
		followingsRepository = module.get(DI.followingsRepository);
		queueService = module.get(QueueService);
		userKeypairService = module.get(UserKeypairService);
		await service.onModuleInit();
	});

	beforeEach(() => {
		vi.clearAllMocks();
		userKeypairService.refreshAndPrepareEd25519KeyPair.mockResolvedValue(undefined);
		followingsRepository.find.mockResolvedValue([]);
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
				false,
			);

			// 呼び出されたinboxesを確認
			const [, , inboxes] = queueService.deliverMany.mock.calls[0];
			expect(inboxes.size).toBe(3);
			expect(inboxes.has('https://remote1.example.com/shared-inbox')).toBe(true);
			expect(inboxes.has('https://remote2.example.com/shared-inbox')).toBe(true);
			expect(inboxes.has('https://remote3.example.com/inbox')).toBe(true);
		});
	});

	describe('deliverToUser', () => {
		it('should deliver activity to specific remote user', async () => {
			await service.deliverToUser(mockLocalUser, mockActivity, mockRemoteUser1);

			expect(queueService.deliverMany).toHaveBeenCalledWith(
				{ id: mockLocalUser.id },
				mockActivity,
				expect.any(Map),
				false,
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

	describe('key announcement', () => {
		it('announces newly prepared keys with RSA before ordinary delivery', async () => {
			userKeypairService.refreshAndPrepareEd25519KeyPair.mockResolvedValue({ userId: mockLocalUser.id } as MiUserKeypair);
			await service.deliverToFollowers(mockLocalUser, mockActivity);
			expect(accountUpdateService.publishToFollowers).toHaveBeenCalledWith(mockLocalUser.id, true);
			expect(accountUpdateService.publishToFollowers.mock.invocationCallOrder[0]).toBeLessThan(queueService.deliverMany.mock.invocationCallOrder[0]);
		});

		it('skips key preparation and announcement for RSA-forced updates', async () => {
			await service.deliverToFollowers(mockLocalUser, mockActivity, true);
			expect(userKeypairService.refreshAndPrepareEd25519KeyPair).not.toHaveBeenCalled();
			expect(accountUpdateService.publishToFollowers).not.toHaveBeenCalled();
			expect(queueService.deliverMany).toHaveBeenCalledWith({ id: mockLocalUser.id }, mockActivity, expect.any(Map), true);
		});
	});
});
