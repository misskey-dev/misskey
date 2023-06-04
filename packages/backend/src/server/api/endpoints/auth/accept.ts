import * as crypto from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AuthSessionsRepository, AppsRepository, AccessTokensRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'auth/accept'> {
	name = 'auth/accept' as const;
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
	) {
		super(async (ps, me) => {
			// Fetch token
			const session = await this.authSessionsRepository
				.findOneBy({ token: ps.token });

			if (session == null) {
				throw new ApiError(this.meta.errors.noSuchSession);
			}

			const accessToken = secureRndstr(32, true);

			// Fetch exist access token
			const exist = await this.accessTokensRepository.findOneBy({
				appId: session.appId,
				userId: me.id,
			});

			if (exist == null) {
				const app = await this.appsRepository.findOneByOrFail({ id: session.appId });

				// Generate Hash
				const sha256 = crypto.createHash('sha256');
				sha256.update(accessToken + app.secret);
				const hash = sha256.digest('hex');

				const now = new Date();

				await this.accessTokensRepository.insert({
					id: this.idService.genId(),
					createdAt: now,
					lastUsedAt: now,
					appId: session.appId,
					userId: me.id,
					token: accessToken,
					hash: hash,
				});
			}

			// Update session
			await this.authSessionsRepository.update(session.id, {
				userId: me.id,
			});
		});
	}
}
