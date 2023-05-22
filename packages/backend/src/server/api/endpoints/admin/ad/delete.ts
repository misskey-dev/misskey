import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AdsRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/ad/delete'> {
	name = 'admin/ad/delete' as const;
	constructor(
		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,
	) {
		super(async (ps, me) => {
			const ad = await this.adsRepository.findOneBy({ id: ps.id });

			if (ad == null) throw new ApiError(this.meta.errors.noSuchAd);

			await this.adsRepository.delete(ad.id);
		});
	}
}
