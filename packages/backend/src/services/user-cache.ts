import { CacheableLocalUser, CacheableUser, ILocalUser, User } from '@/models/entities/user.js';
import { Users } from '@/models/index.js';
import { Cache } from '@/misc/cache.js';
import { subsdcriber } from '@/db/redis.js';

export const userByIdCache = new Cache<CacheableUser>(Infinity);
export const localUserByNativeTokenCache = new Cache<CacheableLocalUser | null>(Infinity);
export const localUserByIdCache = new Cache<CacheableLocalUser>(Infinity);
export const uriPersonCache = new Cache<CacheableUser | null>(Infinity);

subsdcriber.on('message', async (_, data) => {
	const obj = JSON.parse(data);

	if (obj.channel === 'internal') {
		const { type, body } = obj.message;
		switch (type) {
			case 'userChangeSuspendedState':
			case 'userChangeSilencedState':
			case 'userChangeModeratorState':
			case 'remoteUserUpdated': {
				const user = await Users.findOneByOrFail({ id: body.id });
				userByIdCache.set(user.id, user);
				for (const [k, v] of uriPersonCache.cache.entries()) {
					if (v.value?.id === user.id) {
						uriPersonCache.set(k, user);
					}
				}
				if (Users.isLocalUser(user)) {
					localUserByNativeTokenCache.set(user.token, user);
					localUserByIdCache.set(user.id, user);
				}
				break;
			}
			case 'userTokenRegenerated': {
				const user = await Users.findOneByOrFail({ id: body.id }) as ILocalUser;
				localUserByNativeTokenCache.delete(body.oldToken);
				localUserByNativeTokenCache.set(body.newToken, user);
				break;
			}
			default:
				break;
		}
	}
});
