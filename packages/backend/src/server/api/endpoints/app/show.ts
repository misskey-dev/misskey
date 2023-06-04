import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AppsRepository } from '@/models/index.js';
import { AppEntityService } from '@/core/entities/AppEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'app/show'> {
	name = 'app/show' as const;
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private appEntityService: AppEntityService,
	) {
		super(async (ps, user, token) => {
			const isSecure = user != null && token == null;

			// Lookup app
			const ap = await this.appsRepository.findOneBy({ id: ps.appId });

			if (ap == null) {
				throw new ApiError(this.meta.errors.noSuchApp);
			}

			return await this.appEntityService.pack(ap, user, {
				detail: true,
				includeSecret: isSecure && (ap.userId === user!.id),
			});
		});
	}
}
