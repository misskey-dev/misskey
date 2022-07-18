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

export default async (authorization: string | null | undefined, bodyToken: string | null): Promise<[CacheableLocalUser | null | undefined, AccessToken | null | undefined]> => {
	let token: string | null = null;

	// check if there is an authorization header set
	if (authorization != null) {
		if (bodyToken != null) {
			throw new AuthenticationError('using multiple authorization schemes');
		}

		// check if OAuth 2.0 Bearer tokens are being used
		// Authorization schemes are case insensitive
		if (authorization.substring(0, 7).toLowerCase() === 'bearer ') {
			token = authorization.substring(7);
		} else {
			throw new AuthenticationError('unsupported authentication scheme');
		}
	} else if (bodyToken != null) {
		token = bodyToken;
	} else {
		return [null, null];
	}

	if (isNativeToken(token)) {
		const user = await localUserByNativeTokenCache.fetch(token,
			() => Users.findOneBy({ token }) as Promise<ILocalUser | null>);

		if (user == null) {
			throw new AuthenticationError('unknown token');
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
			throw new AuthenticationError('unknown token');
		}

		AccessTokens.update(accessToken.id, {
			lastUsedAt: new Date(),
		});

		const user = await localUserByIdCache.fetch(accessToken.userId,
			() => Users.findOneBy({
				id: accessToken.userId,
			}) as Promise<ILocalUser>);

		if (accessToken.appId) {
			const app = await appCache.fetch(accessToken.appId,
				() => Apps.findOneByOrFail({ id: accessToken.appId! }));

			return [user, {
				id: accessToken.id,
				permission: app.permission,
			} as AccessToken];
		} else {
			return [user, accessToken];
		}
	}
};
