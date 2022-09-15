import { Inject, Injectable } from '@nestjs/common';
import { Users } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import type { CacheableLocalUser, CacheableUser, ILocalUser } from '@/models/entities/User.js';
import type Redis from 'ioredis';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class UserCacheService implements OnApplicationShutdown {
	public userByIdCache: Cache<CacheableUser>;
	public localUserByNativeTokenCache: Cache<CacheableLocalUser | null>;
	public localUserByIdCache: Cache<CacheableLocalUser>;
	public uriPersonCache: Cache<CacheableUser | null>;

	constructor(
		@Inject('redisSubscriber')
		private redisSubscriber: Redis.Redis,
	) {
		this.onMessage = this.onMessage.bind(this);

		this.userByIdCache = new Cache<CacheableUser>(Infinity);
		this.localUserByNativeTokenCache = new Cache<CacheableLocalUser | null>(Infinity);
		this.localUserByIdCache = new Cache<CacheableLocalUser>(Infinity);
		this.uriPersonCache = new Cache<CacheableUser | null>(Infinity);

		this.redisSubscriber.on('message', this.onMessage);
	}

	private async onMessage(_, data) {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message;
			switch (type) {
				case 'userChangeSuspendedState':
				case 'userChangeSilencedState':
				case 'userChangeModeratorState':
				case 'remoteUserUpdated': {
					const user = await Users.findOneByOrFail({ id: body.id });
					this.userByIdCache.set(user.id, user);
					for (const [k, v] of this.uriPersonCache.cache.entries()) {
						if (v.value?.id === user.id) {
							this.uriPersonCache.set(k, user);
						}
					}
					if (Users.isLocalUser(user)) {
						this.localUserByNativeTokenCache.set(user.token, user);
						this.localUserByIdCache.set(user.id, user);
					}
					break;
				}
				case 'userTokenRegenerated': {
					const user = await Users.findOneByOrFail({ id: body.id }) as ILocalUser;
					this.localUserByNativeTokenCache.delete(body.oldToken);
					this.localUserByNativeTokenCache.set(body.newToken, user);
					break;
				}
				default:
					break;
			}
		}
	}

	public onApplicationShutdown(signal?: string | undefined) {
		this.redisSubscriber.off('message', this.onMessage);
	}
}
