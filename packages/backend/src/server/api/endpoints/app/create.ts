import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AppsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { unique } from '@/misc/prelude/array.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { AppEntityService } from '@/core/entities/AppEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'app/create'> {
	name = 'app/create' as const; 
	constructor(
		@Inject(DI.appsRepository)
		private appsRepository: AppsRepository,

		private appEntityService: AppEntityService,
		private idService: IdService,
	) {
		super(async (ps, me) => {
			// Generate secret
			const secret = secureRndstr(32, true);

			// for backward compatibility
			const permission = unique(ps.permission.map(v => v.replace(/^(.+)(\/|-)(read|write)$/, '$3:$1')));

			// Create account
			const app = await this.appsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me ? me.id : null,
				name: ps.name,
				description: ps.description,
				permission,
				callbackUrl: ps.callbackUrl,
				secret: secret,
			}).then(x => this.appsRepository.findOneByOrFail(x.identifiers[0]));

			return await this.appEntityService.pack(app, null, {
				detail: true,
				includeSecret: true,
			});
		});
	}
}
