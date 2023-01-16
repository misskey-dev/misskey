import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { UsersRepository } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import type { CacheableLocalUser, CacheableUser, ILocalUser, User } from '@/models/entities/User.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { StreamMessages } from '@/server/api/stream/types.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class UserCacheService implements OnApplicationShutdown {
	public userByIdCache: Cache<CacheableUser>;
	public localUserByNativeTokenCache: Cache<CacheableLocalUser | null>;
	public localUserByIdCache: Cache<CacheableLocalUser>;
	public uriPersonCache: Cache<CacheableUser | null>;

	constructor(
		@Inject(DI.redisSubscriber)
		private redisSubscriber: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
	) {
		//this.onMessage = this.onMessage.bind(this);

		this.userByIdCache = new Cache<CacheableUser>(Infinity);
		this.localUserByNativeTokenCache = new Cache<CacheableLocalUser | null>(Infinity);
		this.localUserByIdCache = new Cache<CacheableLocalUser>(Infinity);
		this.uriPersonCache = new Cache<CacheableUser | null>(Infinity);

		this.redisSubscriber.on('message', this.onMessage);
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
						this.localUserByNativeTokenCache.set(user.token, user);
						this.localUserByIdCache.set(user.id, user);
					}
					break;
				}
				case 'userTokenRegenerated': {
					const user = await this.usersRepository.findOneByOrFail({ id: body.id }) as ILocalUser;
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
	public findById(userId: User['id']) {
		return this.userByIdCache.fetch(userId, () => this.usersRepository.findOneByOrFail({ id: userId }));
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined) {
		this.redisSubscriber.off('message', this.onMessage);
	}
}
