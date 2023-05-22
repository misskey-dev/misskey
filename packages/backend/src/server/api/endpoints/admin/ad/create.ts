import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AdsRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/ad/create'> {
	name = 'admin/ad/create' as const;
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private idService: IdService,
	) {
		super(async (ps, me) => {
			await this.adsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				expiresAt: new Date(ps.expiresAt),
				startsAt: new Date(ps.startsAt),
				url: ps.url,
				imageUrl: ps.imageUrl,
				priority: ps.priority,
				ratio: ps.ratio,
				place: ps.place,
				memo: ps.memo,
			});
		});
	}
}
