/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { BlockingsRepository, FollowingsRepository, MutingsRepository, RenoteMutingsRepository, MiUserProfile, UserProfilesRepository, UsersRepository, MiFollowing } from '@/models/_.js';
import { MemoryKVCache, RedisKVCache } from '@/misc/cache.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class CacheService implements OnApplicationShutdown {
	public userByIdCache: MemoryKVCache<MiUser>;
	public localUserByNativeTokenCache: MemoryKVCache<MiLocalUser | null>;
	public localUserByIdCache: MemoryKVCache<MiLocalUser>;
	public uriPersonCache: MemoryKVCache<MiUser | null>;
	public userProfileCache: RedisKVCache<MiUserProfile>;
	public userMutingsCache: RedisKVCache<Set<string>>;
	public userBlockingCache: RedisKVCache<Set<string>>;
	public userBlockedCache: RedisKVCache<Set<string>>; // NOTE: 「被」Blockキャッシュ
	public renoteMutingsCache: RedisKVCache<Set<string>>;
	public userFollowingsCache: RedisKVCache<Record<string, Pick<MiFollowing, 'withReplies'> | undefined>>;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.renoteMutingsRepository)
		private renoteMutingsRepository: RenoteMutingsRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
	) {
		//this.onMessage = this.onMessage.bind(this);

		this.userByIdCache = new MemoryKVCache<MiUser>(Infinity);
		this.localUserByNativeTokenCache = new MemoryKVCache<MiLocalUser | null>(Infinity);
		this.localUserByIdCache = new MemoryKVCache<MiLocalUser>(Infinity);
		this.uriPersonCache = new MemoryKVCache<MiUser | null>(Infinity);

		this.userProfileCache = new RedisKVCache<MiUserProfile>(this.redisClient, 'userProfile', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.userProfilesRepository.findOneByOrFail({ userId: key }),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => JSON.parse(value), // TODO: date型の考慮
		});

		this.userMutingsCache = new RedisKVCache<Set<string>>(this.redisClient, 'userMutings', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.mutingsRepository.find({ where: { muterId: key }, select: ['muteeId'] }).then(xs => new Set(xs.map(x => x.muteeId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.userBlockingCache = new RedisKVCache<Set<string>>(this.redisClient, 'userBlocking', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.blockingsRepository.find({ where: { blockerId: key }, select: ['blockeeId'] }).then(xs => new Set(xs.map(x => x.blockeeId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.userBlockedCache = new RedisKVCache<Set<string>>(this.redisClient, 'userBlocked', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.blockingsRepository.find({ where: { blockeeId: key }, select: ['blockerId'] }).then(xs => new Set(xs.map(x => x.blockerId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.renoteMutingsCache = new RedisKVCache<Set<string>>(this.redisClient, 'renoteMutings', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.renoteMutingsRepository.find({ where: { muterId: key }, select: ['muteeId'] }).then(xs => new Set(xs.map(x => x.muteeId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.userFollowingsCache = new RedisKVCache<Record<string, Pick<MiFollowing, 'withReplies'> | undefined>>(this.redisClient, 'userFollowings', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.followingsRepository.find({ where: { followerId: key }, select: ['followeeId', 'withReplies'] }).then(xs => {
				const obj: Record<string, Pick<MiFollowing, 'withReplies'> | undefined> = {};
				for (const x of xs) {
					obj[x.followeeId] = { withReplies: x.withReplies };
				}
				return obj;
			}),
			toRedisConverter: (value) => JSON.stringify(value),
			fromRedisConverter: (value) => JSON.parse(value),
		});

		// NOTE: チャンネルのフォロー状況キャッシュはChannelFollowingServiceで行っている

		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'userChangeSuspendedState':
				case 'userChangeDeletedState':
				case 'remoteUserUpdated':
				case 'localUserUpdated': {
					const user = await this.usersRepository.findOneBy({ id: body.id });
					if (user == null) {
						this.userByIdCache.delete(body.id);
						this.localUserByIdCache.delete(body.id);
						for (const [k, v] of this.uriPersonCache.cache.entries()) {
							if (v.value?.id === body.id) {
								this.uriPersonCache.delete(k);
							}
						}
					} else {
						this.userByIdCache.set(user.id, user);
						for (const [k, v] of this.uriPersonCache.cache.entries()) {
							if (v.value?.id === user.id) {
								this.uriPersonCache.set(k, user);
							}
						}
						if (this.userEntityService.isLocalUser(user)) {
							this.localUserByNativeTokenCache.set(user.token!, user);
							this.localUserByIdCache.set(user.id, user);
						}
					}
					break;
				}
				case 'userTokenRegenerated': {
					const user = await this.usersRepository.findOneByOrFail({ id: body.id }) as MiLocalUser;
					this.localUserByNativeTokenCache.delete(body.oldToken);
					this.localUserByNativeTokenCache.set(body.newToken, user);
					break;
				}
				case 'follow': {
					const follower = this.userByIdCache.get(body.followerId);
					if (follower) follower.followingCount++;
					const followee = this.userByIdCache.get(body.followeeId);
					if (followee) followee.followersCount++;
					this.userFollowingsCache.delete(body.followerId);
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public findUserById(userId: MiUser['id']) {
		return this.userByIdCache.fetch(userId, () => this.usersRepository.findOneByOrFail({ id: userId }));
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
		this.userByIdCache.dispose();
		this.localUserByNativeTokenCache.dispose();
		this.localUserByIdCache.dispose();
		this.uriPersonCache.dispose();
		this.userProfileCache.dispose();
		this.userMutingsCache.dispose();
		this.userBlockingCache.dispose();
		this.userBlockedCache.dispose();
		this.renoteMutingsCache.dispose();
		this.userFollowingsCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
