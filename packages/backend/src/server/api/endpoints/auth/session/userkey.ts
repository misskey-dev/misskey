import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, AppsRepository, AccessTokensRepository, AuthSessionsRepository } from '@/models/index.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'auth/session/userkey'> {
	name = 'auth/session/userkey' as const;
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private userEntityService: UserEntityService,
	) {
		super(async (ps, me) => {
			// Lookup app
			const app = await this.appsRepository.findOneBy({
				secret: ps.appSecret,
			});

			if (app == null) {
				throw new ApiError(this.meta.errors.noSuchApp);
			}

			// Fetch token
			const session = await this.authSessionsRepository.findOneBy({
				token: ps.token,
				appId: app.id,
			});

			if (session == null) {
				throw new ApiError(this.meta.errors.noSuchSession);
			}

			if (session.userId == null) {
				throw new ApiError(this.meta.errors.pendingSession);
			}

			// Lookup access token
			const accessToken = await this.accessTokensRepository.findOneByOrFail({
				appId: app.id,
				userId: session.userId,
			});

			// Delete session
			this.authSessionsRepository.delete(session.id);

			return {
				accessToken: accessToken.token,
				user: await this.userEntityService.pack(session.userId, null, {
					detail: true,
				}),
			};
		});
	}
}
