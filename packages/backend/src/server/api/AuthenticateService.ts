import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AccessTokens, Apps, Users } from '@/models/index.js';
import type { CacheableLocalUser, ILocalUser } from '@/models/entities/User.js';
import type { AccessToken } from '@/models/entities/AccessToken.js';
import { Cache } from '@/misc/cache.js';
import type { App } from '@/models/entities/App.js';
import { UserCacheService } from '@/services/UserCacheService.js';
import isNativeToken from '@/misc/is-native-token.js';

export class AuthenticationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

@Injectable()
export class AuthenticateService {
	#appCache: Cache<App>;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: typeof Users,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: typeof AccessTokens,

		@Inject(DI.appsRepository)
		private appsRepository: typeof Apps,

		private userCacheService: UserCacheService,
	) {
		this.#appCache = new Cache<App>(Infinity);
	}

	public async authenticate(token: string | null): Promise<[CacheableLocalUser | null | undefined, AccessToken | null | undefined]> {
		if (token == null) {
			return [null, null];
		}
	
		if (isNativeToken(token)) {
			const user = await this.userCacheService.localUserByNativeTokenCache.fetch(token,
				() => this.usersRepository.findOneBy({ token }) as Promise<ILocalUser | null>);
	
			if (user == null) {
				throw new AuthenticationError('user not found');
			}
	
			return [user, null];
		} else {
			const accessToken = await this.accessTokensRepository.findOne({
				where: [{
					hash: token.toLowerCase(), // app
				}, {
					token: token, // miauth
				}],
			});
	
			if (accessToken == null) {
				throw new AuthenticationError('invalid signature');
			}
	
			this.accessTokensRepository.update(accessToken.id, {
				lastUsedAt: new Date(),
			});
	
			const user = await this.userCacheService.localUserByIdCache.fetch(accessToken.userId,
				() => this.usersRepository.findOneBy({
					id: accessToken.userId,
				}) as Promise<ILocalUser>);
	
			if (accessToken.appId) {
				const app = await this.#appCache.fetch(accessToken.appId,
					() => this.appsRepository.findOneByOrFail({ id: accessToken.appId! }));
	
				return [user, {
					id: accessToken.id,
					permission: app.permission,
				} as AccessToken];
			} else {
				return [user, accessToken];
			}
		}
	}
}
