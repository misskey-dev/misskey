/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { mockDeep, mockReset } from 'vitest-mock-extended';
import type { FollowingsRepository, FollowRequestsRepository, MiFollowing, MiFollowRequest, MiMeta, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import type { MiLocalUser, MiRemoteUser, MiUser } from '@/models/User.js';
import type { Config } from '@/config.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { IdService } from '@/core/IdService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { QueueService } from '@/core/QueueService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { CacheService } from '@/core/CacheService.js';
import type { UserBlockingService } from '@/core/UserBlockingService.js';

describe('鍵解除時のフォローリクエスト承認', () => {
	let service: UserFollowingService;
	const users = mockDeep<UsersRepository>();
	const profiles = mockDeep<UserProfilesRepository>();
	const requests = mockDeep<FollowRequestsRepository>();
	const followings = mockDeep<FollowingsRepository>();
	const userEntity = mockDeep<UserEntityService>();
	const idService = mockDeep<IdService>();
	const receiver = { id: 'receiver', host: null, uri: null, inbox: null, sharedInbox: null };
	const follower = { id: 'follower', host: null } as MiUser;
	const unexpectedError = new Error('DB error');
	const createdAt = new Date();

	beforeEach(async () => {
		mockReset(users);
		mockReset(profiles);
		mockReset(requests);
		mockReset(followings);
		mockReset(userEntity);
		mockReset(idService);
		const module = await Test.createTestingModule({
			providers: [
				UserFollowingService,
				{ provide: DI.usersRepository, useValue: users },
				{ provide: DI.userProfilesRepository, useValue: profiles },
				{ provide: DI.followRequestsRepository, useValue: requests },
				{ provide: DI.followingsRepository, useValue: followings as unknown }, // 型推論が TS2590 (union type too complex) になるため unknown にする
				{ provide: UserEntityService, useValue: userEntity },
				{ provide: IdService, useValue: idService },
			],
		}).useMocker(() => mockDeep()).compile();
		service = module.get(UserFollowingService);
		requests.find.mockResolvedValue([
			{ followerId: 'first', follower }, { followerId: 'second', follower },
		] as Awaited<ReturnType<FollowRequestsRepository['find']>>);
		profiles.findOneByOrFail.mockResolvedValue({} as Awaited<ReturnType<UserProfilesRepository['findOneByOrFail']>>);
		userEntity.isRemoteUser.mockReturnValue(false);
		idService.parse.mockReturnValue({ date: createdAt } as ReturnType<IdService['parse']>);
	});

	test('処理中に削除された相手をスキップし、残りのリクエストを処理する', async () => {
		requests.find.mockResolvedValue([
			{ followerId: 'first', follower: null }, { followerId: 'second', follower },
		] as Awaited<ReturnType<FollowRequestsRepository['find']>>);
		requests.findOneBy.mockRejectedValue(unexpectedError);
		await expect(service.acceptAllFollowRequests(receiver)).rejects.toBe(unexpectedError);
	});

	test('処理中に取り消されたリクエストをスキップし、残りの想定外エラーは伝播する', async () => {
		requests.findOneBy.mockResolvedValueOnce(null).mockRejectedValueOnce(unexpectedError);
		await expect(service.acceptAllFollowRequests(receiver)).rejects.toBe(unexpectedError);
	});

	test.each([false, true])('複数の申請者とフォロー済みの相手を一括取得し、自動承認の対象だけを承認する（リモート: %s）', async remote => {
		const host = remote ? 'example.com' : null;
		const followed = { id: 'first', host } as MiUser;
		const pending = { id: 'second', host } as MiUser;
		requests.find.mockResolvedValue([
			{ followerId: followed.id, follower: followed }, { followerId: pending.id, follower: pending },
		] as Awaited<ReturnType<FollowRequestsRepository['find']>>);
		profiles.findOneByOrFail.mockResolvedValue({
			followApprovalLocalSeconds: remote ? 0 : 43200,
			followApprovalRemoteSeconds: remote ? 43200 : 0,
			autoAcceptFollowed: true,
		} as Awaited<ReturnType<UserProfilesRepository['findOneByOrFail']>>);
		userEntity.isRemoteUser.mockReturnValue(remote);
		followings.find.mockResolvedValue([{ followeeId: followed.id }] as Awaited<ReturnType<FollowingsRepository['find']>>);
		const accept = vi.spyOn(service, 'acceptFollowRequest').mockResolvedValue();

		await service.acceptAllFollowRequests(receiver);

		expect(accept).toHaveBeenCalledExactlyOnceWith(receiver, followed);
		expect(requests.find).toHaveBeenCalledTimes(1);
		expect(followings.find).toHaveBeenCalledTimes(1);
		expect(followings.exists).not.toHaveBeenCalled();
		expect(users.findOneBy).not.toHaveBeenCalled();
	});
});

describe('Undo / Reject が元の Follow アクティビティの ID を参照する', () => {
	const LOCAL_URL = 'https://local.example';
	const REMOTE_FOLLOW_ID = 'https://remote.example/follows/1';

	let service: UserFollowingService;
	const users = mockDeep<UsersRepository>();
	const requests = mockDeep<FollowRequestsRepository>();
	const followings = mockDeep<FollowingsRepository>();
	const userEntity = mockDeep<UserEntityService>();
	const utility = mockDeep<UtilityService>();
	const queue = mockDeep<QueueService>();
	const cache = mockDeep<CacheService>();
	const blocking = mockDeep<UserBlockingService>();

	const localUser = {
		id: 'local', host: null, uri: null, inbox: null, sharedInbox: null, movedToUri: null,
	} as MiLocalUser;
	const remoteUser = {
		id: 'remote', host: 'remote.example', uri: 'https://remote.example/users/remote', inbox: 'https://remote.example/inbox', sharedInbox: null, movedToUri: null,
	} as MiRemoteUser;

	/** 最後に配送されたアクティビティ */
	function lastDelivered() {
		const content = queue.deliver.mock.lastCall?.[1];
		return content as unknown as { type: string; id?: string; object: { type: string; id?: string } } | undefined;
	}

	beforeEach(async () => {
		mockReset(users);
		mockReset(requests);
		mockReset(followings);
		mockReset(userEntity);
		mockReset(utility);
		mockReset(queue);
		mockReset(cache);
		mockReset(blocking);

		const module = await Test.createTestingModule({
			providers: [
				UserFollowingService,
				ApRendererService,
				{ provide: DI.config, useValue: { url: LOCAL_URL } as Config },
				{ provide: DI.meta, useValue: { enableStatsForFederatedInstances: false } as MiMeta },
				{ provide: DI.usersRepository, useValue: users },
				{ provide: DI.followRequestsRepository, useValue: requests },
				{ provide: DI.followingsRepository, useValue: followings as unknown }, // 型推論が TS2590 (union type too complex) になるため unknown にする
				{ provide: UserEntityService, useValue: userEntity },
				{ provide: UtilityService, useValue: utility },
				{ provide: QueueService, useValue: queue },
				{ provide: CacheService, useValue: cache },
				{ provide: 'UserBlockingService', useValue: blocking },
			],
		}).useMocker(() => mockDeep()).compile();
		service = module.get(UserFollowingService);
		service.onModuleInit();

		userEntity.isLocalUser.mockImplementation(((user: { host: string | null }) => user.host == null) as never);
		userEntity.isRemoteUser.mockImplementation(((user: { host: string | null }) => user.host != null) as never);
		userEntity.genLocalUserUri.mockImplementation(id => `${LOCAL_URL}/users/${id}`);
		userEntity.getUserUri.mockImplementation(user => user.host == null ? `${LOCAL_URL}/users/${user.id}` : user.uri);
		userEntity.pack.mockResolvedValue({} as never);
		utility.isUriLocal.mockImplementation(uri => uri.startsWith(`${LOCAL_URL}/`));
		users.findOneByOrFail.mockResolvedValue({ movedToUri: null } as MiUser);
		followings.insert.mockResolvedValue({} as never);
		cache.userProfileCache.fetch.mockResolvedValue({ followedMessage: null } as never);
	});

	describe('フォロー関係の成立', () => {
		test('ローカル → リモートのフォローリクエストが承認されたとき、送信した Follow の ID を保存する', async () => {
			requests.findOneBy.mockResolvedValue({ id: 'req1', requestId: null, withReplies: false } as MiFollowRequest);

			await service.acceptFollowRequest(remoteUser, localUser);

			expect(followings.insert).toHaveBeenCalledWith(expect.objectContaining({ requestId: `${LOCAL_URL}/follows/req1` }));
		});

		test('リモート → ローカルのフォローリクエストを承認したとき、受信した Follow の ID を保存する', async () => {
			requests.findOneBy.mockResolvedValue({ id: 'req1', requestId: REMOTE_FOLLOW_ID, withReplies: false } as MiFollowRequest);

			await service.acceptFollowRequest(localUser, remoteUser);

			expect(followings.insert).toHaveBeenCalledWith(expect.objectContaining({ requestId: REMOTE_FOLLOW_ID }));
		});

		test('フォロー済みのリモートユーザーから再度 Follow を受け取ったとき、保存する Follow の ID を更新する', async () => {
			const newFollowId = 'https://remote.example/follows/2';
			users.findOneByOrFail.mockResolvedValueOnce(remoteUser).mockResolvedValueOnce(localUser);
			blocking.checkBlocked.mockResolvedValue(false);
			followings.exists.mockResolvedValue(true);

			await service.follow(remoteUser, localUser, { requestId: newFollowId });

			expect(followings.update).toHaveBeenCalledWith({ followerId: remoteUser.id, followeeId: localUser.id }, { requestId: newFollowId });
			expect(lastDelivered()?.type).toBe('Accept');
			expect(lastDelivered()?.object.id).toBe(newFollowId);
		});
	});

	describe('フォロー解除', () => {
		test('リモートユーザーのフォローを解除したときの Undo は、送信した Follow の ID を参照する', async () => {
			followings.findOne.mockResolvedValue({
				id: 'following1', follower: localUser, followee: remoteUser, requestId: `${LOCAL_URL}/follows/req1`,
			} as MiFollowing);

			await service.unfollow(localUser, remoteUser);

			expect(lastDelivered()?.type).toBe('Undo');
			expect(lastDelivered()?.object.id).toBe(`${LOCAL_URL}/follows/req1`);
			// Undo 自体の ID もフォローごとに一意になる
			expect(lastDelivered()?.id).toBe(`${LOCAL_URL}/follows/req1/undo`);
		});

		test('Follow の ID が保存されていないフォロー関係では、従来の ID にフォールバックする', async () => {
			followings.findOne.mockResolvedValue({
				id: 'following1', follower: localUser, followee: remoteUser, requestId: null,
			} as MiFollowing);

			await service.unfollow(localUser, remoteUser);

			expect(lastDelivered()?.type).toBe('Undo');
			expect(lastDelivered()?.object.id).toBe(`${LOCAL_URL}/follows/${localUser.id}/${remoteUser.id}`);
		});

		test('リモートユーザーからのフォロー関係を解除したときの Reject は、受信した Follow の ID を参照する', async () => {
			followings.findOne.mockResolvedValue({
				id: 'following1', follower: remoteUser, followee: localUser, requestId: REMOTE_FOLLOW_ID,
			} as MiFollowing);

			await service.unfollow(remoteUser, localUser);

			expect(lastDelivered()?.type).toBe('Reject');
			expect(lastDelivered()?.object.id).toBe(REMOTE_FOLLOW_ID);
		});
	});

	test('フォローリクエストを取り消したときの Undo は、送信した Follow の ID を参照する', async () => {
		requests.findOneBy.mockResolvedValue({ id: 'req1', requestId: null } as MiFollowRequest);

		await service.cancelFollowRequest(remoteUser, localUser);

		expect(lastDelivered()?.type).toBe('Undo');
		expect(lastDelivered()?.object.id).toBe(`${LOCAL_URL}/follows/req1`);
	});

	test('フォロワーを解除したときの Reject は、受信した Follow の ID を参照する', async () => {
		requests.findOneBy.mockResolvedValue(null);
		followings.findOneBy.mockResolvedValue({ requestId: REMOTE_FOLLOW_ID } as MiFollowing);
		followings.findOne.mockResolvedValue({
			id: 'following1', follower: remoteUser, followee: localUser, requestId: REMOTE_FOLLOW_ID,
		} as MiFollowing);

		await service.rejectFollow(localUser, remoteUser);

		// Reject の配送は await されないため、配送されるまで待つ
		await vi.waitFor(() => expect(queue.deliver).toHaveBeenCalled());
		expect(lastDelivered()?.type).toBe('Reject');
		expect(lastDelivered()?.object.id).toBe(REMOTE_FOLLOW_ID);
	});
});
