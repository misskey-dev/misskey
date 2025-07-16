/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { setTimeout } from 'node:timers/promises';
import type { TestingModule } from '@nestjs/testing';
import { GlobalModule } from '@/GlobalModule.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import {
	MiFollowing,
	MiUser,
	FollowingsRepository,
	FollowRequestsRepository,
	UsersRepository,
} from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { QueueService } from '@/core/QueueService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';

describe('UserSuspendService', () => {
	let app: TestingModule;
	let userSuspendService: UserSuspendService;
	let usersRepository: UsersRepository;
	let followingsRepository: FollowingsRepository;
	let followRequestsRepository: FollowRequestsRepository;
	let userEntityService: jest.Mocked<UserEntityService>;
	let queueService: jest.Mocked<QueueService>;
	let globalEventService: jest.Mocked<GlobalEventService>;
	let apRendererService: jest.Mocked<ApRendererService>;
	let moderationLogService: jest.Mocked<ModerationLogService>;

	async function createUser(data: Partial<MiUser> = {}): Promise<MiUser> {
		const user = {
			id: secureRndstr(16),
			username: secureRndstr(16),
			usernameLower: secureRndstr(16).toLowerCase(),
			host: null,
			isSuspended: false,
			...data,
		} as MiUser;

		await usersRepository.insert(user);
		return user;
	}

	async function createFollowing(follower: MiUser, followee: MiUser, data: Partial<MiFollowing> = {}): Promise<MiFollowing> {
		const following = {
			id: secureRndstr(16),
			followerId: follower.id,
			followeeId: followee.id,
			isFollowerSuspended: false,
			isFollowerHibernated: false,
			withReplies: false,
			notify: null,
			followerHost: follower.host,
			followerInbox: null,
			followerSharedInbox: null,
			followeeHost: followee.host,
			followeeInbox: null,
			followeeSharedInbox: null,
			...data,
		} as MiFollowing;

		await followingsRepository.insert(following);
		return following;
	}

	beforeEach(async () => {
		app = await Test.createTestingModule({
			imports: [GlobalModule],
			providers: [
				UserSuspendService,
				{
					provide: UserEntityService,
					useFactory: () => ({
						isLocalUser: jest.fn(),
						genLocalUserUri: jest.fn(),
					}),
				},
				{
					provide: QueueService,
					useFactory: () => ({
						deliver: jest.fn(),
					}),
				},
				{
					provide: GlobalEventService,
					useFactory: () => ({
						publishInternalEvent: jest.fn(),
					}),
				},
				{
					provide: ApRendererService,
					useFactory: () => ({
						addContext: jest.fn(),
						renderDelete: jest.fn(),
						renderUndo: jest.fn(),
					}),
				},
				{
					provide: ModerationLogService,
					useFactory: () => ({
						log: jest.fn(),
					}),
				},
			],
		}).compile();

		app.enableShutdownHooks();

		userSuspendService = app.get<UserSuspendService>(UserSuspendService);
		usersRepository = app.get<UsersRepository>(DI.usersRepository);
		followingsRepository = app.get<FollowingsRepository>(DI.followingsRepository);
		followRequestsRepository = app.get<FollowRequestsRepository>(DI.followRequestsRepository);
		userEntityService = app.get<UserEntityService>(UserEntityService) as jest.Mocked<UserEntityService>;
		queueService = app.get<QueueService>(QueueService) as jest.Mocked<QueueService>;
		globalEventService = app.get<GlobalEventService>(GlobalEventService) as jest.Mocked<GlobalEventService>;
		apRendererService = app.get<ApRendererService>(ApRendererService) as jest.Mocked<ApRendererService>;
		moderationLogService = app.get<ModerationLogService>(ModerationLogService) as jest.Mocked<ModerationLogService>;

		// Reset mocks
		jest.clearAllMocks();
	});

	afterEach(async () => {
		await app.close();
	});

	describe('suspend', () => {
		test('should suspend user and update database', async () => {
			const user = await createUser();
			const moderator = await createUser();

			await userSuspendService.suspend(user, moderator);

			// ユーザーが凍結されているかチェック
			const suspendedUser = await usersRepository.findOneBy({ id: user.id });
			expect(suspendedUser?.isSuspended).toBe(true);

			// モデレーションログが記録されているかチェック
			expect(moderationLogService.log).toHaveBeenCalledWith(moderator, 'suspend', {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
			});
		});

		test('should mark follower relationships as suspended', async () => {
			const user = await createUser();
			const followee1 = await createUser();
			const followee2 = await createUser();
			const moderator = await createUser();

			// ユーザーがフォローしている関係を作成
			await createFollowing(user, followee1);
			await createFollowing(user, followee2);

			await userSuspendService.suspend(user, moderator);
			await setTimeout(250);

			// フォロー関係が論理削除されているかチェック
			const followings = await followingsRepository.find({
				where: { followerId: user.id },
			});

			expect(followings).toHaveLength(2);
			followings.forEach(following => {
				expect(following.isFollowerSuspended).toBe(true);
			});
		});

		test('should publish internal event for suspension', async () => {
			const user = await createUser();
			const moderator = await createUser();

			await userSuspendService.suspend(user, moderator);
			await setTimeout(250);

			// 内部イベントが発行されているかチェック（非同期処理のため少し待つ）
			await setTimeout(100);

			expect(globalEventService.publishInternalEvent).toHaveBeenCalledWith(
				'userChangeSuspendedState',
				{ id: user.id, isSuspended: true },
			);
		});
	});

	describe('unsuspend', () => {
		test('should unsuspend user and update database', async () => {
			const user = await createUser({ isSuspended: true });
			const moderator = await createUser();

			await userSuspendService.unsuspend(user, moderator);
			await setTimeout(250);

			// ユーザーの凍結が解除されているかチェック
			const unsuspendedUser = await usersRepository.findOneBy({ id: user.id });
			expect(unsuspendedUser?.isSuspended).toBe(false);

			// モデレーションログが記録されているかチェック
			expect(moderationLogService.log).toHaveBeenCalledWith(moderator, 'unsuspend', {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
			});
		});

		test('should restore follower relationships', async () => {
			const user = await createUser({ isSuspended: true });
			const followee1 = await createUser();
			const followee2 = await createUser();
			const moderator = await createUser();

			// 凍結状態のフォロー関係を作成
			await createFollowing(user, followee1, { isFollowerSuspended: true });
			await createFollowing(user, followee2, { isFollowerSuspended: true });

			await userSuspendService.unsuspend(user, moderator);
			await setTimeout(250);

			// フォロー関係が復元されているかチェック
			const followings = await followingsRepository.find({
				where: { followerId: user.id },
			});

			expect(followings).toHaveLength(2);
			followings.forEach(following => {
				expect(following.isFollowerSuspended).toBe(false);
			});
		});

		test('should publish internal event for unsuspension', async () => {
			const user = await createUser({ isSuspended: true });
			const moderator = await createUser();

			await userSuspendService.unsuspend(user, moderator);
			await setTimeout(250);

			// 内部イベントが発行されているかチェック（非同期処理のため少し待つ）
			await setTimeout(100);

			expect(globalEventService.publishInternalEvent).toHaveBeenCalledWith(
				'userChangeSuspendedState',
				{ id: user.id, isSuspended: false },
			);
		});
	});

	describe('integration test: suspend and unsuspend cycle', () => {
		test('should preserve follow relationships through suspend/unsuspend cycle', async () => {
			const user = await createUser();
			const followee1 = await createUser();
			const followee2 = await createUser();
			const moderator = await createUser();

			// 初期のフォロー関係を作成
			await createFollowing(user, followee1);
			await createFollowing(user, followee2);

			// 初期状態の確認
			let followings = await followingsRepository.find({
				where: { followerId: user.id },
			});
			expect(followings).toHaveLength(2);
			followings.forEach(following => {
				expect(following.isFollowerSuspended).toBe(false);
			});

			// 凍結
			await userSuspendService.suspend(user, moderator);
			await setTimeout(250);

			// 凍結後の状態確認
			followings = await followingsRepository.find({
				where: { followerId: user.id },
			});
			expect(followings).toHaveLength(2);
			followings.forEach(following => {
				expect(following.isFollowerSuspended).toBe(true);
			});

			// 凍結解除
			const suspendedUser = await usersRepository.findOneByOrFail({ id: user.id });
			await userSuspendService.unsuspend(suspendedUser, moderator);
			await setTimeout(250);

			// 凍結解除後の状態確認
			followings = await followingsRepository.find({
				where: { followerId: user.id },
			});
			expect(followings).toHaveLength(2);
			followings.forEach(following => {
				expect(following.isFollowerSuspended).toBe(false);
			});
		});
	});

	describe('ActivityPub delivery', () => {
		test('should deliver Delete activity on suspend of local user', async () => {
			const localUser = await createUser({ host: null });
			const moderator = await createUser();

			userEntityService.isLocalUser.mockReturnValue(true);
			userEntityService.genLocalUserUri.mockReturnValue(`https://example.com/users/${localUser.id}`);
			apRendererService.renderDelete.mockReturnValue({ type: 'Delete' } as any);
			apRendererService.addContext.mockReturnValue({ '@context': '...', type: 'Delete' } as any);

			await userSuspendService.suspend(localUser, moderator);
			await setTimeout(250);

			// ActivityPub配信が呼ばれているかチェック
			expect(userEntityService.isLocalUser).toHaveBeenCalledWith(localUser);
			expect(apRendererService.renderDelete).toHaveBeenCalled();
			expect(apRendererService.addContext).toHaveBeenCalled();
		});

		test('should deliver Undo Delete activity on unsuspend of local user', async () => {
			const localUser = await createUser({ host: null, isSuspended: true });
			const moderator = await createUser();

			userEntityService.isLocalUser.mockReturnValue(true);
			userEntityService.genLocalUserUri.mockReturnValue(`https://example.com/users/${localUser.id}`);
			apRendererService.renderDelete.mockReturnValue({ type: 'Delete' } as any);
			apRendererService.renderUndo.mockReturnValue({ type: 'Undo' } as any);
			apRendererService.addContext.mockReturnValue({ '@context': '...', type: 'Undo' } as any);

			await userSuspendService.unsuspend(localUser, moderator);
			await setTimeout(250);

			// ActivityPub配信が呼ばれているかチェック
			expect(userEntityService.isLocalUser).toHaveBeenCalledWith(localUser);
			expect(apRendererService.renderDelete).toHaveBeenCalled();
			expect(apRendererService.renderUndo).toHaveBeenCalled();
			expect(apRendererService.addContext).toHaveBeenCalled();
		});

		test('should not deliver any activity on suspend of remote user', async () => {
			const remoteUser = await createUser({ host: 'remote.example.com' });
			const moderator = await createUser();

			userEntityService.isLocalUser.mockReturnValue(false);

			await userSuspendService.suspend(remoteUser, moderator);
			await setTimeout(250);

			// ActivityPub配信が呼ばれていないことをチェック
			expect(userEntityService.isLocalUser).toHaveBeenCalledWith(remoteUser);
			expect(apRendererService.renderDelete).not.toHaveBeenCalled();
			expect(queueService.deliver).not.toHaveBeenCalled();
		});
	});
});
