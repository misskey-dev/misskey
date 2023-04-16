import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { BlockingsRepository, ChannelFollowingsRepository, FollowingsRepository, MutingsRepository, RenoteMutingsRepository, UserProfile, UserProfilesRepository, UsersRepository } from '@/models/index.js';
import { MemoryKVCache, RedisKVCache } from '@/misc/cache.js';
import type { LocalUser, User } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { StreamMessages } from '@/server/api/stream/types.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class CacheService implements OnApplicationShutdown {
	public userByIdCache: MemoryKVCache<User>;
	public localUserByNativeTokenCache: MemoryKVCache<LocalUser | null>;
	public localUserByIdCache: MemoryKVCache<LocalUser>;
	public uriPersonCache: MemoryKVCache<User | null>;
	public userProfileCache: RedisKVCache<UserProfile>;
	public userMutingsCache: RedisKVCache<Set<string>>;
	public userBlockingCache: RedisKVCache<Set<string>>;
	public userBlockedCache: RedisKVCache<Set<string>>; // NOTE: 「被」Blockキャッシュ
	public renoteMutingsCache: RedisKVCache<Set<string>>;
	public userFollowingsCache: RedisKVCache<Set<string>>;
	public userFollowingChannelsCache: RedisKVCache<Set<string>>;

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

		@Inject(DI.channelFollowingsRepository)
		private channelFollowingsRepository: ChannelFollowingsRepository,

		private userEntityService: UserEntityService,
	) {
		//this.onMessage = this.onMessage.bind(this);

		this.userByIdCache = new MemoryKVCache<User>(Infinity);
		this.localUserByNativeTokenCache = new MemoryKVCache<LocalUser | null>(Infinity);
		this.localUserByIdCache = new MemoryKVCache<LocalUser>(Infinity);
		this.uriPersonCache = new MemoryKVCache<User | null>(Infinity);

		this.userProfileCache = new RedisKVCache<UserProfile>(this.redisClient, 'userProfile', {
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

		this.userFollowingsCache = new RedisKVCache<Set<string>>(this.redisClient, 'userFollowings', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.followingsRepository.find({ where: { followerId: key }, select: ['followeeId'] }).then(xs => new Set(xs.map(x => x.followeeId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.userFollowingChannelsCache = new RedisKVCache<Set<string>>(this.redisClient, 'userFollowingChannels', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.channelFollowingsRepository.find({ where: { followerId: key }, select: ['followeeId'] }).then(xs => new Set(xs.map(x => x.followeeId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as StreamMessages['internal']['payload'];
			switch (type) {
				case 'userChangeSuspendedState':
				case 'remoteUserUpdated': {
					const user = await this.usersRepository.findOneByOrFail({ id: body.id });
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
					break;
				}
				case 'userTokenRegenerated': {
					const user = await this.usersRepository.findOneByOrFail({ id: body.id }) as LocalUser;
					this.localUserByNativeTokenCache.delete(body.oldToken);
					this.localUserByNativeTokenCache.set(body.newToken, user);
					break;
				}
				case 'follow': {
					const follower = this.userByIdCache.get(body.followerId);
					if (follower) follower.followingCount++;
					const followee = this.userByIdCache.get(body.followeeId);
					if (followee) followee.followersCount++;
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public findUserById(userId: User['id']) {
		return this.userByIdCache.fetch(userId, () => this.usersRepository.findOneByOrFail({ id: userId }));
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		this.redisForSub.off('message', this.onMessage);
	}
}
