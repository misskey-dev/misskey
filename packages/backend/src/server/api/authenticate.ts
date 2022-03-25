import isNativeToken from './common/is-native-token.js';
import { CacheableLocalUser, ILocalUser } from '@/models/entities/user.js';
import { Users, AccessTokens, Apps } from '@/models/index.js';
import { AccessToken } from '@/models/entities/access-token.js';
import { Cache } from '@/misc/cache.js';
import { App } from '@/models/entities/app.js';
import { localUserByIdCache, localUserByNativeTokenCache } from '@/services/user-cache.js';

const appCache = new Cache<App>(Infinity);

export class AuthenticationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

export default async (token: string | null): Promise<[CacheableLocalUser | null | undefined, AccessToken | null | undefined]> => {
	if (token == null) {
		return [null, null];
	}

	if (isNativeToken(token)) {
		// TODO: typeorm 3.0にしたら .then(x => x || null) は消せる
		const user = await localUserByNativeTokenCache.fetch(token,
			() => Users.findOne({ token }).then(x => x || null) as Promise<ILocalUser | null>);

		if (user == null) {
			throw new AuthenticationError('user not found');
		}

		return [user, null];
	} else {
		const accessToken = await AccessTokens.findOne({
			where: [{
				hash: token.toLowerCase(), // app
			}, {
				token: token, // miauth
			}],
		});

		if (accessToken == null) {
			throw new AuthenticationError('invalid signature');
		}

		AccessTokens.update(accessToken.id, {
			lastUsedAt: new Date(),
		});

		const user = await localUserByIdCache.fetch(accessToken.userId,
			() => Users.findOne({
				id: accessToken.userId, // findOne(accessToken.userId) のように書かないのは後方互換性のため
			}) as Promise<ILocalUser>);

		if (accessToken.appId) {
			const app = await appCache.fetch(accessToken.appId,
				() => Apps.findOneOrFail(accessToken.appId!));

			return [user, {
				id: accessToken.id,
				permission: app.permission,
			} as AccessToken];
		} else {
			return [user, accessToken];
		}
	}
};
