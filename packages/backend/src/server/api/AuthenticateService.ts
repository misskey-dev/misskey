import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AccessTokensRepository, AppsRepository, UsersRepository } from '@/models/index.js';
import type { LocalUser } from '@/models/entities/User.js';
import type { AccessToken } from '@/models/entities/AccessToken.js';
import { KVCache } from '@/misc/cache.js';
import type { App } from '@/models/entities/App.js';
import { UserCacheService } from '@/core/UserCacheService.js';
import isNativeToken from '@/misc/is-native-token.js';
import { bindThis } from '@/decorators.js';

export class AuthenticationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

@Injectable()
export class AuthenticateService {
	private appCache: KVCache<App>;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private userCacheService: UserCacheService,
	) {
		this.appCache = new KVCache<App>(Infinity);
	}

	@bindThis
	public async authenticate(token: string | null | undefined): Promise<[LocalUser | null | undefined, AccessToken | null | undefined]> {
		if (token == null) {
			return [null, null];
		}
	
		if (isNativeToken(token)) {
			const user = await this.userCacheService.localUserByNativeTokenCache.fetch(token,
				() => this.usersRepository.findOneBy({ token }) as Promise<LocalUser | null>);
	
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
				}) as Promise<LocalUser>);
	
			if (accessToken.appId) {
				const app = await this.appCache.fetch(accessToken.appId,
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
