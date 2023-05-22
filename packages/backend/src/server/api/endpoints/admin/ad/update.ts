import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AdsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/ad/update'> {
	name = 'admin/ad/update' as const;
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,
	) {
		super(async (ps, me) => {
			const ad = await this.adsRepository.findOneBy({ id: ps.id });

			if (ad == null) throw new ApiError(this.meta.errors.noSuchAd);

			await this.adsRepository.update(ad.id, {
				url: ps.url,
				place: ps.place,
				priority: ps.priority,
				ratio: ps.ratio,
				memo: ps.memo,
				imageUrl: ps.imageUrl,
				expiresAt: new Date(ps.expiresAt),
				startsAt: new Date(ps.startsAt),
			});
		});
	}
}
