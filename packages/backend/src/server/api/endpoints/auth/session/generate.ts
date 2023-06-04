import { v4 as uuid } from 'uuid';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AppsRepository, AuthSessionsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'auth/session/genrate'> {
	name = 'auth/session/genrate' as const;
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		private idService: IdService,
	) {
		super(async (ps, me) => {
			// Lookup app
			const app = await this.appsRepository.findOneBy({
				secret: ps.appSecret,
			});

			if (app == null) {
				throw new ApiError(this.meta.errors.noSuchApp);
			}

			// Generate token
			const token = uuid();

			// Create session token document
			const doc = await this.authSessionsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				appId: app.id,
				token: token,
			}).then(x => this.authSessionsRepository.findOneByOrFail(x.identifiers[0]));

			return {
				token: doc.token,
				url: `${this.config.authUrl}/${doc.token}`,
			};
		});
	}
}
