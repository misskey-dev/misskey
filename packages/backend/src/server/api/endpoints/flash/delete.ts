import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'flash/delete'> {
	name = 'flash/delete' as const;
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,
	) {
		super(async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw new ApiError(this.meta.errors.noSuchFlash);
			}
			if (flash.userId !== me.id) {
				throw new ApiError(this.meta.errors.accessDenied);
			}

			await this.flashsRepository.delete(flash.id);
		});
	}
}
