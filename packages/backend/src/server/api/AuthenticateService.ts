/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { AccessTokensRepository, AppsRepository, UsersRepository } from '@/models/_.js';
import type { MiLocalUser } from '@/models/User.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import { MemoryKVCache } from '@/misc/cache.js';
import type { MiApp } from '@/models/App.js';
import { CacheService } from '@/core/CacheService.js';
import isNativeToken from '@/misc/is-native-token.js';
import { bindThis } from '@/decorators.js';

export class AuthenticationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'AuthenticationError';
	}
}

@Injectable()
export class AuthenticateService implements OnApplicationShutdown {
	private appCache: MemoryKVCache<MiApp>;

	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private cacheService: CacheService,
	) {
		this.appCache = new MemoryKVCache<MiApp>(1000 * 60 * 60 * 24 * 7); // 1w
	}

	@bindThis
	public async authenticate(token: string | null | undefined): Promise<[MiLocalUser | null, MiAccessToken | null]> {
		if (token == null) {
			return [null, null];
		}

		if (isNativeToken(token)) {
			const user = await this.cacheService.localUserByNativeTokenCache.fetch(token,
				() => this.usersRepository.findOneBy({ token }) as Promise<MiLocalUser | null>);

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

			const user = await this.cacheService.localUserByIdCache.fetch(accessToken.userId,
				() => this.usersRepository.findOneBy({
					id: accessToken.userId,
				}) as Promise<MiLocalUser>);

			if (accessToken.appId) {
				const app = await this.appCache.fetch(accessToken.appId,
					() => this.appsRepository.findOneByOrFail({ id: accessToken.appId! }));

				return [user, {
					id: accessToken.id,
					permission: app.permission,
				} as MiAccessToken];
			} else {
				return [user, accessToken];
			}
		}
	}

	@bindThis
	public dispose(): void {
		this.appCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
