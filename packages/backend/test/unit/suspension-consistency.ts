/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { mockDeep } from 'vitest-mock-extended';
import { In } from 'typeorm';
import { GlobalModule } from '@/GlobalModule.js';
import { DI } from '@/di-symbols.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import type { InstanceEntityService } from '@/core/entities/InstanceEntityService.js';
import type { FollowingsRepository, InstancesRepository, MiUser, UsersRepository } from '@/models/_.js';
import FederationStats from '@/server/api/endpoints/federation/stats.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';

describe('suspension consistency', () => {
	let app: TestingModule;
	let users: UsersRepository;
	let followings: FollowingsRepository;
	let instances: InstancesRepository;
	let suspension: UserSuspendService;
	let following: UserFollowingService;
	const userIds: string[] = [];
	const instanceIds: string[] = [];

	beforeAll(async () => {
		app = await Test.createTestingModule({ imports: [GlobalModule], providers: [UserSuspendService] })
			.useMocker(() => mockDeep())
			.compile();
		users = app.get(DI.usersRepository);
		followings = app.get(DI.followingsRepository);
		instances = app.get(DI.instancesRepository);
		suspension = app.get(UserSuspendService);
		vi.spyOn(suspension as any, 'postSuspend').mockResolvedValue(undefined);
		vi.spyOn(suspension as any, 'postUnsuspend').mockResolvedValue(undefined);
		following = Object.assign(Object.create(UserFollowingService.prototype), {
			usersRepository: users,
			followingsRepository: followings,
			followRequestsRepository: app.get(DI.followRequestsRepository),
			idService: { gen: () => secureRndstr(16) },
			cacheService: { userFollowingsCache: { refresh: vi.fn() } },
			globalEventService: { publishInternalEvent: vi.fn() },
			userEntityService: {
				isRemoteUser: (user: MiUser) => user.host != null,
				isLocalUser: (user: MiUser) => user.host == null,
				isSuspendedEither: (user: MiUser) => user.isSuspended || ('isRemoteSuspended' in user && user.isRemoteSuspended === true),
			},
			meta: {},
			perUserFollowingChart: { update: vi.fn() },
		});
	});

	afterEach(async () => {
		await followings.delete([{ followerId: In(userIds) }, { followeeId: In(userIds) }]);
		await users.delete({ id: In(userIds.splice(0)) });
		await instances.delete({ id: In(instanceIds.splice(0)) });
	});
	afterAll(async () => { await app.close(); });

	async function user(host: string | null = `${secureRndstr(8)}.example.com`) {
		const id = secureRndstr(16);
		userIds.push(id);
		await users.insert({ id, username: id, usernameLower: id, host });
		return await users.findOneByOrFail({ id });
	}

	async function follow(follower: MiUser, followee: MiUser) {
		await following['insertFollowingDoc'](followee, follower, true);
	}

	test.each([true, false])('follow creation agrees with suspension in either order (follow first: %s)', async followFirst => {
		const actor = await user();
		const target = await user();
		if (followFirst) await follow(actor, target);
		await suspension.suspend(actor, actor);
		if (!followFirst) await follow(actor, target); // actor still has the old flag
		expect((await followings.findOneByOrFail({ followerId: actor.id })).isFollowerSuspended).toBe(true);
		await suspension.unsuspend(actor, actor);
		expect((await followings.findOneByOrFail({ followerId: actor.id })).isFollowerSuspended).toBe(false);
	});

	test('concurrent follow, suspend and unsuspend leave both tables consistent', async () => {
		const actor = await user();
		const target = await user();
		await Promise.all([follow(actor, target), suspension.suspend(actor, actor), suspension.unsuspend(actor, actor)]);
		const current = await users.findOneByOrFail({ id: actor.id });
		expect((await followings.findOneByOrFail({ followerId: actor.id })).isFollowerSuspended).toBe(current.isSuspended);
	});

	test('mutual following excludes either suspended direction and restores on unsuspend', async () => {
		const a = await user();
		const b = await user();
		await follow(a, b);
		await follow(b, a);
		expect(await following.isMutual(a.id, b.id)).toBe(true);
		for (const actor of [a, b]) {
			await suspension.suspend(actor, actor);
			expect(await following.isMutual(a.id, b.id)).toBe(false);
			await suspension.unsuspend(actor, actor);
		}
		expect(await following.isMutual(a.id, b.id)).toBe(true);
	});

	test('reciprocal follows can be inserted concurrently without a deadlock', async () => {
		const a = await user();
		const b = await user();
		await Promise.all([follow(a, b), follow(b, a)]);
		expect(await following.isMutual(a.id, b.id)).toBe(true);
	});

	test('statistics rank active relationships, not stale instance counters', async () => {
		const prefix = secureRndstr(8);
		const hosts = [`${prefix}-active.example.com`, `${prefix}-suspended.example.com`, `${prefix}-other.example.com`];
		for (const [index, host] of hosts.entries()) {
			const id = secureRndstr(16);
			instanceIds.push(id);
			await instances.insert({ id, host, firstRetrievedAt: new Date(), followersCount: index ? 100 : 0, followingCount: index ? 100 : 0 });
			const a = await user(host);
			const b = await user(null);
			for (const [follower, followee] of [[a, b], [b, a]]) {
				await followings.insert({ id: secureRndstr(16), followerId: follower.id, followeeId: followee.id, followerHost: follower.host, followeeHost: followee.host });
			}
			if (index === 0) {
				const c = await user(null);
				await followings.insert({ id: secureRndstr(16), followerId: c.id, followeeId: a.id, followerHost: null, followeeHost: a.host });
			}
			if (index === 1) {
				await suspension.suspend(a, a);
				await suspension.suspend(b, b);
			}
		}
		const packer = { packMany: async (values: unknown[]) => values } as unknown as InstanceEntityService;
		const endpoint = new FederationStats(instances, followings, packer);
		const result = await endpoint.exec({ limit: 1 }, null, null);
		expect(result.topSubInstances[0]).toMatchObject({ host: hosts[0], followersCount: 2 });
		expect(result.topPubInstances[0]).toMatchObject({ host: hosts[0], followingCount: 1 });
		expect(result.otherFollowersCount).toBe(1);
		expect(result.otherFollowingCount).toBe(1);
	});

	test('statistics handle no relationships', async () => {
		const packer = { packMany: async (values: unknown[]) => values } as unknown as InstanceEntityService;
		const endpoint = new FederationStats(instances, followings, packer);
		expect(await endpoint.exec({ limit: 1 }, null, null)).toEqual({
			topSubInstances: [], topPubInstances: [], otherFollowersCount: 0, otherFollowingCount: 0,
		});
	});
});
